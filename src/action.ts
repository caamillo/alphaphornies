import { Token, KeyType } from "./types"

const sleep = (amount: number): Promise<boolean> =>
    new Promise ((resolve) => {
        setTimeout(() => {
            resolve(true)
        }, amount)
    })

export const createAction = async (token: Token): Promise<boolean> => {
    const { key, value } = token
    switch (key.type) {
        case KeyType.PRINT:
            console.log(value?.value)
            break
        case KeyType.SLEEP:
            return await sleep(Number(value?.value))
    }
    return true
}