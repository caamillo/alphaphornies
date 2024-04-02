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

    for (let ktype of keys) {
        if (cmp(key, ktype)) return (KeyType as any)[ktype as keyof typeof KeyType]
    }

    return KeyType.UNKNOWN
}

const valueResolver = (value: string): ValueType => {
    if (!value) return ValueType.UNKNOWN

    if (!isNaN(Number(value))) {
        if (value.includes('.')) return ValueType.DOUBLE
        return ValueType.INTEGER
    }

    if (value.length === 1) return ValueType.CHAR
    if (value.startsWith(SpecialCharacters.STRING_1) || value.startsWith(SpecialCharacters.STRING_2)) return ValueType.STRING

    return ValueType.UNKNOWN
}

const resolve = (row: [ string, number ], nrow: Number, keys: string[]): Token | undefined => {
    const [ data, indentation ] = row
    const [ key, value ] = rowParser(data).map((el, c) =>
        !c
            ? { type: keyResolver(el, keys), value: el }
            : { type: valueResolver(el), value: el }
    )
    
    if (!key) {
        console.error(`At line ${ nrow }: Invalid Syntax!`)
        return undefined
    }

    const valType: ValueType = value?.type !== undefined ? value.type as ValueType : ValueType.UNKNOWN

    const token = {
        indentation: indentation,
        value: { type: valType, value: parseValueByType(value?.value, valType) }
    }

    if (typeof key === 'string') {
        return {
            ...token,
            key: { type: key, value: key },
            plugin: true
        }
    }
    
    return {
        ...token,
        key: { type: key.type as KeyType, value: key.value },
        plugin: false
    }
}

export const translate = (data: string, keys: string[]): Token[] => {
    const tokens: Token[] = []
    const rows: [ string, number ][] = sanitizeRows(data.split('\n'))

    rows.map((row, nrow) => {
        const token = resolve(row, nrow, keys)
        if (token) tokens.push(token)
    })

    return tokens
}