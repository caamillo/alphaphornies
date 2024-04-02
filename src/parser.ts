import { Token, KeyType, ValueType, SpecialCharacters, anyInput } from './types'
import { sanitizeRows, cmp } from './utils'

const parseValueByType = (value: string, type: ValueType): anyInput => {
    switch (type) {
        case ValueType.INTEGER:
            return parseInt(value)
        case ValueType.DOUBLE:
            return parseFloat(value)
        case ValueType.STRING:
        case ValueType.CHAR:
            return value.substring(1, value.length - 1)
        case ValueType.UNKNOWN:
        default:
            return undefined
    }
}

const rowParser = (row: string): string[] => {
    const keywords = []
    let ignoreSpace = false
    let kw = ""
    
    loop:
    for (let char of row.split('')) {
        if (keywords.length >= 2) break
        switch (char) {
            case SpecialCharacters.SPACE:
                if (!ignoreSpace) {
                    keywords.push(kw)
                    kw = ""
                    continue loop
                }
                break
            case SpecialCharacters.COMMENT:
                break loop
            case SpecialCharacters.STRING_1:
            case SpecialCharacters.STRING_2:
                ignoreSpace = !ignoreSpace
        }
        kw += char
    }
    if (kw.length) keywords.push(kw)

    return keywords
}

const keyResolver = (key: string, keys: string[]): KeyType | string => {
    if (!key) return KeyType.UNKNOWN

    for (let ktype of Object.keys(KeyType).filter(key => isNaN(Number(key)))) {
        if (cmp(key, ktype)) return (KeyType as any)[ktype as keyof typeof KeyType]
    }

    if (keys.includes(key)) return key
    return KeyType.UNKNOWN
}

const valueResolver = (value: string, vals: string[]): ValueType | string => {
    if (!value) return ValueType.UNKNOWN

    if (!isNaN(Number(value))) {
        if (value.includes('.')) return ValueType.DOUBLE
        return ValueType.INTEGER
    }

    if (value.length === 1) return ValueType.CHAR
    if (value.startsWith(SpecialCharacters.STRING_1) || value.startsWith(SpecialCharacters.STRING_2)) return ValueType.STRING

    if (vals.includes(value)) return value
    return ValueType.UNKNOWN
}

const resolve = (row: [ string, number ], nrow: Number, keys: string[], vals: string[]): Token | undefined => {
    const [ data, indentation ] = row
    const [ key, value ] = rowParser(data).map((el, c) =>
        !c
            ? { type: keyResolver(el, keys), value: el }
            : { type: valueResolver(el, vals), value: el }
    )
    
    if (!key) {
        console.error(`At line ${ nrow }: Invalid Syntax!`)
        return undefined
    }
    
    const keyType: KeyType = key.type as KeyType
    const valType: ValueType = value?.type !== undefined ? value.type as ValueType : ValueType.UNKNOWN
    
    return {
        indentation: indentation,
        key: { type: keyType, value: key.value },
        value: { type: valType, value: parseValueByType(value?.value, valType) },
        plugin: false
    }
}

export const translate = (data: string, keys: string[], vals: string[]): Token[] => {
    const tokens: Token[] = []
    const rows: [ string, number ][] = sanitizeRows(data.split('\n'))

    rows.map((row, nrow) => {
        const token = resolve(row, nrow, keys, vals)
        if (token) tokens.push(token)
    })

    return tokens
}