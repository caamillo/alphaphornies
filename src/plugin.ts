import { ExpectedValue, ActionList, Plugin, ActionResponse } from "./types"
import { createResponse } from "./action"

interface pluginOptions {
    name: string,
    keys?: string[],
    constructs?: string[],
    expectedValues?: ExpectedValue[],
    actions?: ActionList
    // vals?: string[]
}

interface pluginResponseParams {
    shouldkill?: boolean
}

export const createPluginResponse = (ok: boolean, msg?: string, params?: pluginResponseParams): ActionResponse =>
    createResponse(!ok, !!params?.shouldkill, msg)

export const createPlugin = (opt: pluginOptions): Plugin => {
    opt = Object.fromEntries(
        Object.entries(opt).filter(([ _, val ]) => val !== undefined)
    ) as pluginOptions

    return opt
}