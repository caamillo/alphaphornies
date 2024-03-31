import { Token, Program, ConstructTypes, Construct, KeyType, Node, Nodes, ExpectedValues, Crash, ValueType } from "./types"
import { createAction } from "./action"
import { crash } from "./utils"

const isConstruct = (token: Token): Boolean =>
    ConstructTypes.includes(token.key.type)

const createNodes = (tokens: Token[], indentation: number, start=0): { nodes: Nodes, index?: number } => {
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
    let keytype: KeyType
    if ('type' in node)  keytype = node.type
    else keytype = node.key.type

    const expected = ExpectedValues.find(({ key }) => key === keytype)
    if (!expected) return false

    if (expected.value === undefined || expected.value === ValueType.UNKNOWN) return true
    if (node?.value === undefined || !('type' in node.value)) return false
    
    if (typeof expected.value === 'object') return expected.value.includes(node.value.type)
    else return node.value.type === expected.value
}

const compileNodes = (nodes: Nodes): (number | Crash) => {
    let line = 0
    for (let node of nodes) {
        if (!validateNode(node)) return crash(line, "Invalid Syntax")
        if (!('children' in node)) {
            if (!createAction(node)) return crash(line, "Invalid Action")
        } else {
            if (node.type === KeyType.SETUP) compileNodes(node.children)
            else if (node.type === KeyType.REPEAT) {
                for (let i = 0; i < Number(node.value?.value); i++)
                    compileNodes(node.children)
            } else if (node.type === KeyType.LOOP) {
                while (true)
                    compileNodes(node.children)
            }
        }
        line++
    }
    return 0
}

export const createProgram = (tokens: Token[]): Program => {
    let indentation = 0
    const { nodes } = createNodes(tokens, indentation)
    return {
        nodes: nodes,
        start: () => compileNodes(nodes)
    }
}