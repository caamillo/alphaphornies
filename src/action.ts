import { Token, KeyType } from "./types"

export const createAction = (token: Token): boolean => {
    const { key, value } = token
    switch (key.type) {
        case KeyType.PRINT:
            console.log(value?.value)
            break
    }
    return true
}