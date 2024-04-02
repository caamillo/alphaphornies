import { ExpectedValue, ActionList, Plugin } from "./types"

interface pluginOptions {
    name: string,
    keys?: string[],
    constructs?: string[],
    expectedValues?: ExpectedValue[],
    actions?: ActionList
    // vals?: string[]
}

export const createPlugin = (opt: pluginOptions): Plugin => {
    opt = Object.fromEntries(
        Object.entries(opt).filter(([ _, val ]) => val !== undefined)
    ) as pluginOptions

    return opt
}