import { Token, Program, ConstructTypes, Construct, KeyType, Node, Nodes, ExpectedValues, Crash, ValueType, Plugin, ActionList, ExpectedValue, pluginsModel, DynamicData } from "./types"
import { createAction, sleep } from "./action"
import { crash, cmpStandardKey, cmp } from "./utils"
import { readFileSync } from "fs"
import { translate } from "./parser"

const isConstruct = (token: Token): Boolean =>
    typeof token.key.type === 'string' ?
        dynamic_data.constructs.includes(token.key.type) :
        ConstructTypes.includes(token.key.type)

const createNodes = (tokens: Token[], indentation=0, start=0): { nodes: Nodes, index?: number } => {
    const children: Nodes = []
    for (let i = start; i < tokens.length; i++) {
        const token = tokens[i]
        if (token.indentation === indentation) {
            if (!isConstruct(token)) children.push(token)
            else {
                const { nodes, index } = createNodes(tokens, indentation + 1, i + 1)
                let construct = {
                    type: token.key.type,
                    value: {
                        type: token?.value?.type as ValueType,
                        value: token?.value?.value
                    },
                    children: nodes
                }

                children.push(construct as Construct)
                if (index) i += index + 1
            }
        } else return {
            nodes: children,
            index: i
        }
    }
    return {
        nodes: children
    }
}

const validateNode = (node: Node): Boolean => {
    let keytype: KeyType | string
    if ('type' in node) keytype = node.type
    else keytype = node.key.type
    
    if (cmpStandardKey(keytype, KeyType.UNKNOWN)) return false

    const expected = dynamic_data.expectedValues.find(({ key }) =>
        typeof keytype === 'string' ?
            cmp(keytype, key as string) :
            Object.keys(KeyType).filter(key => isNaN(Number(key)))[ keytype ] === key
    )
    if (!expected) return false

    if (expected.value === undefined || expected.value === ValueType.UNKNOWN) return true
    if (node?.value === undefined || !('type' in node.value)) return false
    
    if (typeof expected.value === 'object') return expected.value.includes(node.value.type)
    else return node.value.type === expected.value
}

const compileNodes = async (nodes: Nodes, from=0, line=0): Promise<Crash> => {
    let status: Crash = {
        err: 0,
        line: line,
        msg: '',
        shouldkill: false
    }
    for (let node of nodes) {
        if (line < from) {
            line++
            continue
        }
        if (!validateNode(node)) return crash(line, "Invalid Syntax")
        if (!('children' in node)) {
            const actionRes = await createAction(node, dynamic_data, mountPlugin, line)
            if (actionRes.err) return crash(line, "Invalid Action")
            if (actionRes.kill) status = crash(line, "", 0, true)
        } else {
            if (cmpStandardKey(node.type, KeyType.SETUP)) status = await compileNodes(node.children, from, ++line)
            else if (cmpStandardKey(node.type, KeyType.REPEAT)) {
                for (let i = 0; i < Number(node.value?.value); i++)
                    status = await compileNodes(node.children, from, ++line)
            } else if (cmpStandardKey(node.type, KeyType.LOOP)) {
                while (!status.err)
                    status = await compileNodes(node.children, from, ++line)
            }
        }
        if (status.err) return crash(line, status.msg) 
        else if (status.shouldkill) return crash(line, '', 0, true)
        line++
    }
    return status
}

const dynamic_data: DynamicData = {
    data: '',
    tokens: [],
    nodes: [],
    keys: Object.keys(KeyType).filter(key => isNaN(Number(key))),
    constructs: ConstructTypes,
    expectedValues: ExpectedValues.map(({ key, value }) => {
        return {
            key: typeof key !== 'string' ?
                Object.keys(KeyType).filter(key => isNaN(Number(key)))[ key ] :
                key,
            value: value
        }
    }),
    customActions: []
}

/*
const valTypes = [
    ...Object.keys(ValueType).filter(key => isNaN(Number(key)))
]
*/

const plugins: pluginsModel = {
    mounted: [],
    unmounted: []
}

const mountPlugin = async (name: string, line: number): Promise<boolean> => {
    const plugin = plugins.unmounted.find(el => el.name === name)
    if (!plugin) return false

    if (plugin.keys) dynamic_data.keys.push(...plugin.keys)
    if (plugin.constructs) dynamic_data.constructs.push(...plugin.constructs)
    if (plugin.expectedValues) dynamic_data.expectedValues.push(...plugin.expectedValues)
    if (plugin.actions) dynamic_data.customActions.push(...plugin.actions)

    plugins.mounted.push(plugin)
    plugins.unmounted = plugins.unmounted.filter(el => el.name !== name)

    dynamic_data.tokens = translate(dynamic_data, line)
    dynamic_data.nodes = createNodes(dynamic_data.tokens).nodes
    await compileNodes(dynamic_data.nodes, line + 1) // Restart from the compiling line + 1
    return true
}

export const createProgram = (file: string): Program => {
    dynamic_data.data = readFileSync(file, 'utf-8')
    return {
        use: (plugin: Plugin) => {
            plugins.unmounted.push(plugin)

            // if (plugin.vals) valTypes.push(...plugin.vals)
        },
        start: async () => {
            dynamic_data.tokens = translate(dynamic_data)
            dynamic_data.nodes = createNodes(dynamic_data.tokens).nodes
            return await compileNodes(dynamic_data.nodes)
        }
    }
}