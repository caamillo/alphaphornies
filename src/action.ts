import { Token, KeyType, ValueType } from "./types"

export const createAction = (token: Token): number => {
    const { key, value } = token
    switch (key.type) {
        case KeyType.PRINT:
            if (!value?.value) return 1
            console.log(value.value)
            break
    }
    return 0
}