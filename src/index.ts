import { createProgram } from "./core"
import { printDiffTime } from "./utils"

const example = "examples/hello_world.ap"
const startDate = new Date()

;(async () => {
    try {
        const program = createProgram(example)
        const { err, line, msg } = await program.start()
        if (err) console.log(`Program crashed at line ${ line }\nError Message: ${ msg }`)
        printDiffTime(startDate)
    } catch (err) {
        console.error("Error while reading file, ", err)
    }
})()