import { Token, KeyType, ActionList, ValueType, DynamicData, ActionResponse } from "./types"
import { cmp } from "./utils"

export const sleep = (amount: number): Promise<boolean> =>
    new Promise ((resolve) => {
        setTimeout(() => {
            resolve(true)
        }, amount)
    })

export const createResponse = (err = false, kill = false): ActionResponse => {
    return {
        err: err,
        kill: kill
    }
}

export const createAction = async (token: Token, dynamic_data: DynamicData, mountPlugin: (name: string, line: number) => Promise<boolean>, line: number): Promise<ActionResponse> => {
    const { key, value } = token
    
    if (typeof key.type === 'string') {
        for (let action of dynamic_data.customActions) {
            if (cmp(key.type, action.key)) return createResponse(!(await action.launch(value)))
        }
        return createResponse(true)
    }

    switch (key.type) {
        case KeyType.PRINT:
            console.log(value?.value)
            break
        case KeyType.SLEEP:
            return createResponse(await sleep(Number(value?.value)))
        case KeyType.REQUIRE:
            mountPlugin(value?.value as string, line)
            return createResponse(false, true)
        default:
            return createResponse(true)
    }

    return createResponse(false)
}