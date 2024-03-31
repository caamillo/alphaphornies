import { Token, KeyType, ValueType } from "./types"

export const createAction = async (token: Token): Promise<boolean> => {
    const { key, value } = token
    switch (key.type) {
        case KeyType.PRINT:
            console.log(value?.value)
            break
        case KeyType.SLEEP:
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true)
                }, Number(value?.value))
            })
    }
    return true
}