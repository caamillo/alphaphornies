import { Token, Program, ConstructTypes, Construct, KeyType, Node, Nodes, ExpectedValues, Crash, ValueType, Plugin, ActionList, ExpectedValue } from "./types"
import { createAction } from "./action"
import { crash, cmpStandardKey, cmp } from "./utils"
import { readFileSync } from "fs"
import { translate } from "./parser"

const isConstruct = (token: Token): Boolean =>
    typeof token.key.type === 'string' ?
        constructs.includes(token.key.type) :
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

    const expected = expectedValues.find(({ key }) =>
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

const compileNodes = async (nodes: Nodes, line=0): Promise<number | Crash> => {
    let status: Crash = {
        err: 0,
        line: line,
        msg: ''
    }
    for (let node of nodes) {
        if (!validateNode(node)) return crash(line, "Invalid Syntax")
        if (!('children' in node)) {
            if (!(await createAction(node, customActions))) return crash(line, "Invalid Action")
        } else {
            if (cmpStandardKey(node.type, KeyType.SETUP)) status = await compileNodes(node.children, ++line) as Crash
            else if (cmpStandardKey(node.type, KeyType.REPEAT)) {
                for (let i = 0; i < Number(node.value?.value); i++)
                    status = await compileNodes(node.children, ++line) as Crash
            } else if (cmpStandardKey(node.type, KeyType.LOOP)) {
                while (!status.err)
                    status = await compileNodes(node.children, ++line) as Crash
            }
        }
        if (status.err) return crash(line, status.msg) 
        line++
    }
    return 0
}

const keyTypes: string[] = [
    ...Object.keys(KeyType).filter(key => isNaN(Number(key)))
]

/*
const valTypes = [
    ...Object.keys(ValueType).filter(key => isNaN(Number(key)))
]
*/

const constructs: (KeyType | string)[] = [
    ...ConstructTypes
]

const expectedValues: ExpectedValue[] = [
    ...ExpectedValues.map(({ key, value }) => {
        return {
            key: typeof key === 'string' ? key : keyTypes[ key ],
            value: value
        }
    })
]

const customActions: ActionList = []

export const createProgram = (file: string): Program => {
    const data = readFileSync(file, 'utf-8')
    return {
        use: (plugin: Plugin) => {
            if (plugin.keys) keyTypes.push(...plugin.keys)
            if (plugin.constructs) constructs.push(...plugin.constructs)
            if (plugin.expectedValues) expectedValues.push(...plugin.expectedValues)
            if (plugin.actions) customActions.push(...plugin.actions)
            // if (plugin.vals) valTypes.push(...plugin.vals)
        },
        start: async () => {
            const tokens = translate(data, keyTypes)
            const { nodes } = createNodes(tokens)
            return await compileNodes(nodes)
        }
    }
}