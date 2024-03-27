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
    STARTSPAM,
    STOPSPAM,

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

export interface Token {
    indentation: Number,
    key: {
        type: KeyType,
        value?: String
    },
    value?: {
        type: ValueType,
        value: String
    }
}

export enum ConstructType {
    SETUP = KeyType.SETUP,
    LOOP = KeyType.LOOP,
    REPEAT = KeyType.REPEAT
}

export interface Construct {
    type: ConstructType,
    children: (Token | Construct)[]
}

export interface Repeat extends Construct {
    times: number
}

export interface Program {
    nodes: (Token | Construct)[],
    start: Function
}