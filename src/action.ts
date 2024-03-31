import { Token, KeyType, ValueType } from "./types"

export const createAction = (token: Token): boolean => {
    const { key, value } = token
    switch (key.type) {
        case KeyType.PRINT:
            if (!value?.value) return false
            console.log(value.value)
            break
    }
    return true
}