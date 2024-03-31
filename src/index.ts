import { readFileSync } from "fs"
import { translate } from "./parser"
import { createProgram } from "./core"

const example = "examples/hello_world.ap"

;(async () => {
    try {
        const data = readFileSync(example, 'utf-8')
        const tokens = translate(data)
        const program = createProgram(tokens)
        const { err, line, msg } = await program.start()
        if (err) console.log(`Program crashed at line ${ line }\nError Message: ${ msg }`)
    } catch (err) {
        console.error("Error while reading file, ", err)
    }
})()