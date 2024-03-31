import { Crash } from "./types"

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

export const crash = (line=-1, msg="", code=1): Crash => {
    return {
        err: code,
        line: line,
        msg: msg
    }
}