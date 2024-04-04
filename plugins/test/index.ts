import { createPlugin } from "../../src/plugin"
import { ValueType } from "../../src/types"

enum KeyTypes {
    TEST
}

export const pokePlugin = createPlugin({
    name: 'test',
    keys: Object.keys(KeyTypes).filter(el => isNaN(Number(el))),
    expectedValues: [
        {
            key: Object.keys(KeyTypes).filter(el => isNaN(Number(el)))[0],
            value: ValueType.STRING
        }
    ],
    actions: [
        {
            key: Object.keys(KeyTypes).filter(el => isNaN(Number(el)))[0],
            launch: (val) => {
                if (!val) return false
                console.log(`Test Plugin - ${ val.value }`)
                return true
            }
        }
    ]
})