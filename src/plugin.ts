import { ExpectedValuePlugin, ActionList, Plugin } from "./types"

interface pluginOptions {
    name: string,
    keys?: string[],
    vals?: string[],
    constructs?: string[],
    expectedValues?: ExpectedValuePlugin[],
    actions?: ActionList
}

export const createPlugin = (opt: pluginOptions): Plugin => {
    opt = Object.fromEntries(
        Object.entries(opt).filter(([ _, val ]) => val !== undefined)
    ) as pluginOptions

    return opt
}