// Deps
import { randomBytes } from "crypto"

import { createPlugin, createPluginResponse } from "../../src/plugin"
import { ValueType } from "../../src/types"

enum KeyTypes {
    CREATE_ANIM             = "CREATE_ANIM",
    START_ANIM              = "START_ANIM",
    ANIM_ADD_STATIC_DRAW    = "ANIM_ADD_STATIC_DRAW",
    ANIM_ADD_DYNAMIC_DRAW   = "ANIM_ADD_DYNAMIC_DRAW"
}

enum Shapes {
    RECTANGLE   = 'RECTANGLE'
}

enum DrawType {
    STATIC,
    DYNAMIC
}

interface Keyframe {
    w: number,
    h: number
}

interface StaticDraw {
    size: Keyframe
}

interface DynamicDraw {
    keyframes: Keyframe[],
    iterations: number | 'infinite',
    delay: number
}

interface Draw {
    type: DrawType,
    shape: Shapes,
    value: StaticDraw | DynamicDraw
}

interface Animation {
    id: string,
    pull: Draw[]
}

enum Morphs {
    TRANSFORM = "TRANSFORM"
}

interface ShapeMorph {
    shape_id: string,
    draw: Draw,
    morph_type: Morphs,
    morph_value?: Keyframe,
    life: number | 'infinite'
}

type Update = { [key: string]: ShapeMorph[] }

interface Compiled {
    init: ShapeMorph[],
    updates: Update[] // <timestamp>: ShapeMorph
}

const animations: Animation[] = []

const drawRect = (w: number, h: number) => {
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            if ((!i || i === h - 1) || (!j || j === w - 1)) process.stdout.write('* ')
            else process.stdout.write('  ')
        }
        process.stdout.write('\n')
    }
}

const compileAnimation = (animation: Animation): Compiled => {
    const compiled: Compiled = {
        init: [],
        updates: []
    }

    for (let draw of animation.pull) {
        let shape_id = randomBytes(48).toString('hex')
        const morph: ShapeMorph = {
            shape_id: shape_id,
            draw: draw,
            morph_type: Morphs.TRANSFORM,
            morph_value: draw.type === DrawType.STATIC && 'size' in draw.value ?
                draw.value.size :
                    draw.type === DrawType.DYNAMIC && 'keyframes' in draw.value ?
                draw.value.keyframes[0] : undefined,
            life: draw.type === DrawType.DYNAMIC && 'iterations' in draw.value ?
                draw.value.iterations : 0
        }

        compiled.init = [
            ...(compiled.init ?? []),
            morph
        ]
    }

    const dynamicDraws = compiled.init.filter(({ draw }) => draw.type === DrawType.DYNAMIC && 'keyframes' in draw.value).sort((a, b) => {
        const dyns = {
            a: (a.draw.value as DynamicDraw),
            b: (b.draw.value as DynamicDraw)
        }

        const aDepth = dyns.a.keyframes.slice(1).length * dyns.a.delay
        const bDepth = dyns.b.keyframes.slice(1).length * dyns.b.delay

        return bDepth - aDepth
    })
    // [3, 300]
    // [2, 100]
    // 2 * 300 = 600
    // 1 * 100 = 100
    // 300, 600
    // 100, 200, 300, 400, 500, 600
    morphLoop:
    for (let morph of dynamicDraws) {
        const dyn = (morph.draw.value as DynamicDraw)
        let start = 0, i = 0, framecount = 0, row = 0
        while (row < Number(dyn.iterations)) {
            const lastTimestamp = compiled.updates.length > row ? Number(Object.keys(compiled.updates[row]).at(-1)) : dyn.keyframes.slice(1).length * dyn.delay
            if (compiled.updates.length <= row) compiled.updates.push({} as Update)
            let accumulated = start > 0 ? start : dyn.delay
            start = 0
            
            const keyframes = dyn.keyframes.slice(1)
            const frames = keyframes.length
            let idx = 0
            while (accumulated <= lastTimestamp) {
                const keyframe = keyframes[idx]
                // console.log('Accumulated', accumulated , i, lastTimestamp)
                compiled.updates[row][`${ accumulated }`] = [
                    ...(compiled.updates[row][`${ accumulated }`] ?? []),
                    {
                        ...morph,
                        morph_value: keyframe
                    }
                ]

                accumulated += dyn.delay
                framecount++
                if (idx < keyframes.length - 1) idx++
                else idx = 0
                if (framecount >= frames) {
                    framecount = 0
                    i++
                }
                if (i >= Number(dyn.iterations)) continue morphLoop
            }

            if (!isNaN(Number(lastTimestamp)) && accumulated !== lastTimestamp) start = accumulated - Number(lastTimestamp)
            row++
        }
    }

    /*
    if (draw.type == DrawType.DYNAMIC) {
        const anim = draw.value as DynamicDraw
        let timestamp = 0
        for (let keyframe of anim.keyframes.slice(1)) {
            timestamp += anim.delay

            compiled.updates[`${ timestamp }`] = [
                ...(compiled.updates[`${ timestamp }`] ?? []),
                {
                    ...morph,
                    morph_value: keyframe
                }
            ]
        }
    }   
    const sortedKeys = Object.keys(compiled.updates).sort((a, b) => parseInt(a) - parseInt(b))
    const sortedUpdates: { [key: string]: ShapeMorph[] } = {}
    sortedKeys.map((key, c) => {
        sortedUpdates[key] = Object.values(compiled.updates)[c]
    })*/

    return compiled
}

const startAnimation = async (compiled: Compiled) => {
    let acc: number
    let image: ShapeMorph[] = []
    let iteration = 1
    do {
        process.stdout.write('\x1Bc')
        acc = 0
        image = JSON.parse(JSON.stringify(compiled.init.map((el, c) => {
            if (!image.length) return el
            el.life = image[c].life
            return el
        })))
        if (image.some(draw => !draw.morph_value)) return createPluginResponse(false, `during animation a shape has been found with an invalid morph value`)

        for (let draw of image) {
            drawRect(draw.morph_value?.w as number, draw.morph_value?.h as number)
        }
        console.log(`\nIteration n. ${ iteration }`)

        for (let iter of compiled.updates) {
            for (let [ delayStr, morphs ] of Object.entries(iter)) {
                const delay = parseInt(delayStr)
                for (let draw of morphs) {
                    const shape = image.find(el => el.shape_id === draw.shape_id)
                    if (!shape) return createPluginResponse(false, `during morph animation, a shape has been not found anymore`)
        
                    shape.morph_value = draw.morph_value
                }
                await new Promise((resolve) => {
                    setTimeout(() => {
                        process.stdout.write('\x1Bc')
                        for (let draw of image) {
                            drawRect(draw.morph_value?.w as number, draw.morph_value?.h as number)
                        }
                        console.log(`\nIteration n. ${ iteration }`)
                        resolve(true)
                    }, delay - acc)
                })
                acc += delay
            }
        }
        iteration++
        for (let draw of image) {
            if (draw.life !== 'infinite' && draw.life <= 0) continue
            if (draw.life !== 'infinite' && draw.life > 0) draw.life--
        }
        if (image.some(draw => draw.life === 'infinite' || draw.life > 0)) await new Promise(resolve => {
            setTimeout(() => {
                resolve(true)
            }, parseInt(Object.keys(compiled.updates)[0]))
        })
    } while(image.some(draw => draw.life === 'infinite' || draw.life > 0))
    return createPluginResponse(true)
}

const expectedValues = Object.keys(KeyTypes).map(key => {
    return {
        key: key,
        value: ValueType.STRING
    }
})

export const pokePlugin = createPlugin({
    name: 'drawer',
    keys: Object.keys(KeyTypes),
    expectedValues: expectedValues,
    actions: [
        {
            key: KeyTypes.CREATE_ANIM,
            launch: (val) => {
                if (!val || typeof val.value !== 'string') return createPluginResponse(false, 'Value not valid')

                animations.push({
                    id: val.value,
                    pull: []
                })

                return createPluginResponse(true)
            }
        },
        {
            key: KeyTypes.START_ANIM,
            launch: async (val) => {
                if (!val || typeof val.value !== 'string') return createPluginResponse(false, 'Value not valid')
                const animation = animations.find(anim => anim.id === val.value)
                if (!animation) return createPluginResponse(false, `${ val.value } is not a defined animation.`)

                const compiled = compileAnimation(animation)
                return await startAnimation(compiled)
            }
        },
        {
            key: KeyTypes.ANIM_ADD_STATIC_DRAW,
            launch: (val) => {
                if (!val || typeof val.value !== 'string') return createPluginResponse(false, 'Value not valid')
                let [ anim_id, shape, argstr ] = val.value.split('\\')
                const args = argstr.split(',')

                if (!Object.keys(Shapes).includes(shape.toUpperCase())) return createPluginResponse(false, `${ shape } is not a valid shape`)
                if (!args[0] || !args[1] || isNaN(Number(args[0])) || isNaN(Number(args[1]))) return createPluginResponse(false, 'Size arguments not valid')

                const animIdx = animations.findIndex(({ id }) => id === anim_id)
                if (animIdx < 0) return createPluginResponse(false, `${ anim_id } is not a defined animation.`)

                animations[animIdx].pull.push({
                    type: DrawType.STATIC,
                    shape: shape as Shapes,
                    value: {
                        size: { w: Number(args[0]), h: Number(args[1]) } 
                    } as StaticDraw
                })

                return createPluginResponse(true)
            }
        },
        {
            key: KeyTypes.ANIM_ADD_DYNAMIC_DRAW,
            launch: async (val) => {
                if (!val || typeof val.value !== 'string') return createPluginResponse(false, 'Value not valid')
                // RECTANGLE(shape)\3,3;4,4;5,5(keyframes)\3(n.iterations|`infinite`)\100(ms delay)
                const [ anim_id, shape, keyframesStr, iterationsStr, delayStr ] = val.value.split('\\')

                if (!Object.keys(Shapes).includes(shape.toUpperCase())) return createPluginResponse(false, `${ shape } is not a valid shape`)
                if (!keyframesStr.length) return createPluginResponse(false, `Invalid keyframes`)
                if (!iterationsStr.length || (iterationsStr !== 'infinite' && isNaN(Number(iterationsStr)))) return createPluginResponse(false, `Invalid iteration directive`)
                if (!delayStr.length || isNaN(Number(delayStr))) return createPluginResponse(false, `Invalid delay`)

                let keyframesCheck = keyframesStr.split(';').map(keyframe => keyframe.split(',')).map((keyframe, c) => {
                    return {
                        w: (keyframe[0]?.length > 0 && !isNaN(Number(keyframe[0]))) ? Number(keyframe[0]) : undefined,
                        h: (keyframe[1]?.length > 0 && !isNaN(Number(keyframe[1]))) ? Number(keyframe[1]) : undefined,
                        n: c
                    }
                })
                const invalidKeyframe = keyframesCheck.find(kf => typeof kf.w === 'undefined' || typeof kf.h === 'undefined')
                if (invalidKeyframe) return createPluginResponse(false, `Keyframe n.${ invalidKeyframe.n } (${ typeof invalidKeyframe.w !== 'undefined' ? invalidKeyframe.w : 'x' },${ typeof invalidKeyframe.h !== 'undefined' ? invalidKeyframe.h : 'x' }) is not valid`)

                const keyframes = keyframesCheck.map(kf => {
                    return {
                        w: kf.w,
                        h: kf.h
                    }
                })
                const iterations = iterationsStr === 'infinite' ? 'infinite' : Number(iterationsStr)
                const delay = Number(delayStr)

                const animIdx = animations.findIndex(({ id }) => id === anim_id)
                if (animIdx < 0) return createPluginResponse(false, `${ anim_id } is not a defined animation.`)
                animations[animIdx].pull.push({
                    type: DrawType.DYNAMIC,
                    shape: shape as Shapes,
                    value: {
                        keyframes: keyframes,
                        iterations: iterations,
                        delay: delay
                    } as DynamicDraw
                })

                return createPluginResponse(true)
            }
        }
    ]
})