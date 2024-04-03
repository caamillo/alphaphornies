import { Token, KeyType, ActionList, ValueType } from "./types"
import { cmp } from "./utils"

const sleep = (amount: number): Promise<boolean> =>
    new Promise ((resolve) => {
        setTimeout(() => {
            resolve(true)
        }, amount)
    })

export const createAction = async (token: Token, customActions: ActionList ): Promise<boolean> => {
    const { key, value } = token
    
    if (typeof key.type === 'string') {
        for (let action of customActions) {
            if (cmp(key.type, action.key)) return await action.launch(value)
        }
        return false
    }

    switch (key.type) {
        case KeyType.PRINT:
            console.log(value?.value)
            break
        case KeyType.SLEEP:
            return await sleep(Number(value?.value))
        default:
            return false
    }

    return true
}