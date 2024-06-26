export enum KeyType {
    // Stage
    SETUP,
    LOOP,

    // Essential
    SLEEP,
    PRINT,
    HOLD,
    RELEASE,
    REPEAT,
    WRITE,

    // Articulated
    PRESS,
    WAITFOR,
    SPAM,

    REQUIRE,

    UNKNOWN
}

export enum ValueType {
    INTEGER,
    DOUBLE,
    CHAR,
    STRING,
    
    UNKNOWN
}

export enum SpecialCharacters {
    SPACE = " ",
    COMMENT = "#",
    STRING_1 = '"',
    STRING_2 = "'"
}

export type anyInput = (string | number | undefined)

export interface Token {
    indentation: Number,
    key: {
        type: KeyType | string,
        value?: string
    },
    value?: {
        type: ValueType,
        value: anyInput
    },
    plugin: boolean
}

export const ConstructTypes: KeyType[] = [
    KeyType.SETUP,
    KeyType.LOOP,
    KeyType.REPEAT,
    KeyType.SPAM
]

export interface Construct {
    type: KeyType | string,
    value?: {
        type: ValueType,
        value: anyInput,
    },
    children: Nodes
}

export interface Program {
    use: (arg: Plugin) => undefined,
    start: Function
}

export interface ExpectedValue {
    key: KeyType | string,
    value: ValueType | ValueType[]
}

export const ExpectedValues: ExpectedValue[] = [
    { key: KeyType.SETUP,   value: ValueType.UNKNOWN },
    { key: KeyType.LOOP,    value: ValueType.UNKNOWN },
    { key: KeyType.SLEEP,   value: [ ValueType.INTEGER, ValueType.DOUBLE ] },
    { key: KeyType.PRINT,   value: [ ValueType.INTEGER, ValueType.DOUBLE, ValueType.CHAR, ValueType.STRING ] },
    { key: KeyType.HOLD,    value: [ ValueType.INTEGER, ValueType.CHAR, ValueType.STRING ] },
    { key: KeyType.RELEASE, value: [ ValueType.INTEGER, ValueType.CHAR, ValueType.STRING ] },
    { key: KeyType.REPEAT,  value: ValueType.INTEGER },
    { key: KeyType.WRITE,   value: [ ValueType.INTEGER, ValueType.DOUBLE, ValueType.CHAR, ValueType.STRING ] },
    { key: KeyType.PRESS,   value: [ ValueType.INTEGER, ValueType.CHAR, ValueType.STRING ] },
    { key: KeyType.WAITFOR, value: ValueType.STRING },
    { key: KeyType.SPAM,    value: [ ValueType.INTEGER, ValueType.DOUBLE, ValueType.CHAR, ValueType.STRING ] },
    { key: KeyType.REQUIRE, value: ValueType.STRING },
    { key: KeyType.UNKNOWN, value: ValueType.UNKNOWN },
]

export type Node = (Token | Construct)
export type Nodes = Node[]

export interface Crash {
    err: number,
    line: number,
    msg: string,
    shouldkill: boolean
}

export interface Action {
    key: string,
    launch: (arg: { type: ValueType, value: anyInput } | undefined) => Promise<ActionResponse> | ActionResponse
}

export type ActionList = Action[]

export interface Plugin {
    name: string,
    keys?: string[],
    constructs?: string[],
    expectedValues?: ExpectedValue[],
    actions?: ActionList
    // vals?: string[]
}

export interface pluginsModel {
    mounted: Plugin[],
    unmounted: Plugin[]
}

export interface DynamicData {
    data: string,
    tokens: Token[],
    nodes: Nodes
    keys: string[],
    constructs: (KeyType | string)[],
    expectedValues: ExpectedValue[],
    customActions: ActionList
}

export interface ActionResponse {
    err: boolean,
    kill: boolean,
    msg?: string
}