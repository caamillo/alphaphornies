import { readFileSync } from "fs"
import { translate } from "./parser"
import { createProgram } from "./core"
import { KeyType } from "./types"

const example = "examples/hello_world.ap"

try {
    const data = readFileSync(example, 'utf-8')
    const tokens = translate(data)
    const program = createProgram(tokens)
    program.start()
} catch (err) {
    console.error("Error while reading file, ", err)
}