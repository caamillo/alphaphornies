// Deps
import { randomBytes } from "crypto"

import { createPlugin } from "../../src/plugin"
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
    morph_type: Morphs,
    morph_value: Keyframe,
    life: number
}

interface Compiled {
    init: Draw[],
    updates: {
        [key: string]: ShapeMorph[] // <timestamp (e.g. 0 | 100 | 200)ms>: Draw[]
    }
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

const compileAnimation = (animation: Animation) => {
    const compiled: Compiled = {
        init: [],
        updates: {}
    }

    const status = []
    for (let draw of animation.pull) {
        let shape_id = randomBytes(48).toString('hex') // TODO: add id to ALL shapes
        compiled.init = [
            ...(compiled.init ?? []),
            draw
        ]
        if (draw.type == DrawType.DYNAMIC) {
            const anim = draw.value as DynamicDraw
            let timestamp = 0
            if (anim.iterations === 'infinite') return false // TODO: add a working infinite animation
            for (let keyframe of anim.keyframes) {
                timestamp += anim.delay
                compiled.updates[`${ timestamp }`] = [
                    ...(compiled.updates[`${ timestamp }`] ?? []),
                    {
                        shape_id: shape_id,
                        morph_type: Morphs.TRANSFORM,
                        morph_value: keyframe,
                        life: anim.iterations
                    }
                ]
            }
        }
    }
    console.log(compiled.updates['100'])
    /*if (iterations === 'infinite') {
        while (true) {
            await new Promise((resolve1) => setInterval(async () => {
                for (let [ w, h ] of keyframes) {
                    await new Promise((resolve2) => setTimeout(() => {
                        process.stdout.write('\x1Bc')
                        drawRect(w, h)
                        resolve2(true)
                    }, delay))
                }
                resolve1(true)
            }, delay))
        }
    }
    for (let i = 0; i < iterations; i++) {
        await new Promise((resolve1) => setTimeout(async () => {
            for (let [ w, h ] of keyframes) {
                await new Promise((resolve2) => setTimeout(() => {
                    process.stdout.write('\x1Bc')
                    drawRect(w, h)
                    resolve2(true)
                }, delay))
            }
            resolve1(true)
        }, delay))
    }*/
}

const startAnimation = async () => {
    process.stdout.write('\x1Bc')
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
                if (!val || typeof val.value !== 'string') return false

                animations.push({
                    id: val.value,
                    pull: []
                })

                return true
            }
        },
        {
            key: KeyTypes.START_ANIM,
            launch: async (val) => {
                if (!val || typeof val.value !== 'string') return false
                const animation = animations.find(anim => anim.id === val.value)
                if (!animation) return false

                const compiled = compileAnimation(animation)

                return true
            }
        },
        {
            key: KeyTypes.ANIM_ADD_STATIC_DRAW,
            launch: (val) => {
                if (!val || typeof val.value !== 'string') return false
                let [ anim_id, shape, argstr ] = val.value.split('\\')
                const args = argstr.split(',')

                if (!Object.keys(Shapes).includes(shape.toUpperCase())) return false
                if (!args[0] || !args[1] || isNaN(Number(args[0])) || isNaN(Number(args[1]))) return false

                const animIdx = animations.findIndex(({ id }) => id === anim_id)
                if (animIdx < 0) return false

                animations[animIdx].pull.push({
                    type: DrawType.STATIC,
                    shape: shape as Shapes,
                    value: {
                        size: { w: Number(args[0]), h: Number(args[1]) } 
                    } as StaticDraw
                })

                return true
            }
        },
        {
            key: KeyTypes.ANIM_ADD_DYNAMIC_DRAW,
            launch: async (val) => {
                if (!val || typeof val.value !== 'string') return false
                // RECTANGLE(shape)\3,3;4,4;5,5(keyframes)\3(n.iterations|`infinite`)\100(ms delay)
                const [ anim_id, shape, keyframesStr, iterationsStr, delayStr ] = val.value.split('\\')

                if (!Object.keys(Shapes).includes(shape.toUpperCase())) return false
                if (!keyframesStr.length) return false
                if (!iterationsStr.length || (iterationsStr !== 'infinite' && isNaN(Number(iterationsStr)))) return false
                if (!delayStr.length || isNaN(Number(delayStr))) return false

                const keyframes = keyframesStr.split(';').map(keyframe => keyframe.split(',')).map(keyframe => {
                    return {
                        w: Number(keyframe[0]),
                        h: Number(keyframe[1])
                    }
                })
                const iterations = iterationsStr === 'infinite' ? 'infinite' : Number(iterationsStr)
                const delay = Number(delayStr)

                const animIdx = animations.findIndex(({ id }) => id === anim_id)
                if (animIdx < 0) return false
                animations[animIdx].pull.push({
                    type: DrawType.DYNAMIC,
                    shape: shape as Shapes,
                    value: {
                        keyframes: keyframes,
                        iterations: iterations,
                        delay: delay
                    } as DynamicDraw
                })

                return true
            }
        }
    ]
})