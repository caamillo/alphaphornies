import { Token, Program, ConstructType, Construct, Repeat, KeyType } from "./types"
import { createAction } from "./action"
import { cmp } from "./utils"

const isConstruct = (token: Token): Boolean => {
    const type = token.key.type as unknown as ConstructType
    return !!Object.values(ConstructType)
                .filter(key => isNaN(Number(key)))
                .filter(key => cmp(KeyType[type], key as string))
                .length
}
const createNodes = (tokens: Token[], indentation: number, start=0): { nodes: (Token | Construct | Repeat)[], index?: number } => {
    const children: (Token | Construct)[] = []
    for (let i = start; i < tokens.length; i++) {
        const token = tokens[i]
        if (token.indentation === indentation) {
            const constructType = token.key.type as unknown as ConstructType
            if (!isConstruct(token)) children.push(token)
            else {
                const { nodes, index } = createNodes(tokens, indentation + 1, i + 1)
                let construct = {
                    type: constructType,
                    children: nodes
                }
                if (construct.type === ConstructType.REPEAT) construct = {
                    ...construct,
                    times: Number(token.value?.value)
                } as Repeat

                children.push(construct)
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

const compileNodes = (nodes: (Token | Construct | Repeat)[]): number => {
    for (let node of nodes) {
        if (!('children' in node)) {
            if (createAction(node)) return 1
        } else {
            if (node.type === ConstructType.SETUP) compileNodes(node.children)
            else if (node.type === ConstructType.REPEAT && 'times' in node) {
                if (isNaN(node.times) || node.times <= 0 || `${ node.times }`.includes('.')) return 1
                for (let i = 0; i < node.times; i++)
                    compileNodes(node.children)
            } else if (node.type === ConstructType.LOOP) {
                while (true)
                    compileNodes(node.children)
            }
        }
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