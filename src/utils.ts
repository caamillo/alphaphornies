import { Crash, KeyType } from "./types"
import ms from "ms"

const countIndentation = (word: String, ind=4): Number => {
    let count = 0
    for (let char of word.split('')) {
        if (char !== ' ') break
        count += 1
    }
    return count / ind
}

export const sanitizeRows = (rows: Array<String>): [ string, number ][] =>
    rows.map(row => row.trimEnd())
        .filter(row => row.length)
        .map(row => [ row.trimStart(), countIndentation(row) ] as [ string, number ])

export const cmp = (key1: String, key2: String): Boolean =>
    key1.toUpperCase() === key2.toUpperCase()

export const crash = (line=-1, msg="", code=1, shouldkill=false): Crash => {
    return {
        err: code,
        line: line,
        msg: msg,
        shouldkill: shouldkill
    }
}

export const printDiffTime = (start: Date) => {
    const now = new Date()
    console.log(`Execution time: ~${ ms(now.getTime() - start.getTime()) }`)
}

export const cmpStandardKey = (key1: KeyType | string, key2: KeyType): boolean =>
    typeof key1 !== 'string' && key1 === key2

export const isStandardKey = (key: string): boolean =>
    Object.keys(KeyType)
        .filter(el => isNaN(Number(el)))
        .filter(el => cmp(key, el))
        .length > 0