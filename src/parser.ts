import { Token, KeyType, ValueType, SpecialCharacters } from './types'
import { sanitizeRows, cmp } from './utils'

const rowParser = (row: String): Array<String> => {
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
                continue loop
        }
        kw += char
    }
    if (kw.length) keywords.push(kw)

    return keywords
}

const keyResolver = (key: String): KeyType => {
    if (!key) return KeyType.UNKNOWN

    for (let ktype of Object.keys(KeyType).filter(key => isNaN(Number(key)))) {
        if (cmp(key, ktype)) return (KeyType as any)[ktype as keyof typeof KeyType]
    }
    return KeyType.UNKNOWN
}

const valueResolver = (value: String): ValueType => {
    if (!value) return ValueType.UNKNOWN

    if (!isNaN(Number(value))) {
        if (value.includes('.')) return ValueType.DOUBLE
        return ValueType.INTEGER
    }
    if (value.length === 1) return ValueType.CHAR
    if (value.startsWith('"') || value.startsWith("'")) return ValueType.STRING

    return ValueType.UNKNOWN
}

const resolve = (row: [ string, number ], nrow: Number): Token | undefined => {
    const [ data, indentation ] = row
    const [key, value] = rowParser(data).map((el, c) =>
        !c
            ? { type: keyResolver(el), value: el }
            : { type: valueResolver(el), value: el }
    )

    if (!key) {
        console.error(`At line ${nrow}: ${key}< Invalid Syntax!`)
        return undefined
    }

    const keyType: KeyType = key.type as KeyType
    const valType: ValueType = value?.type ? value.type as ValueType : ValueType.UNKNOWN

    return {
        indentation: indentation,
        key: { type: keyType, value: key.value },
        value: { type: valType, value: value?.value }
    }
}

export const translate = (data: String): Token[] => {
    const tokens: Token[] = []
    const rows: [ string, number ][] = sanitizeRows(data.split('\n'))

    rows.map((row, nrow) => {
        const token = resolve(row, nrow)
        if (token) tokens.push(token)
    })

    return tokens
}