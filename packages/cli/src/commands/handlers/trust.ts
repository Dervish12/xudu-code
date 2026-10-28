import { EOL } from "node:os"
import path from "node:path"
import { Effect, Option } from "effect"
import { Global } from "@xudu/util/global"
import { WorkspaceTrust } from "@xudu/util/workspace-trust"
import { Commands } from "../commands"
import { Runtime } from "../../framework/runtime"
import { projectRoot } from "../../workspace-trust"

export default Runtime.handler(
  Commands.commands.trust,
  Effect.fn("cli.trust")(function* (input) {
    const global = yield* Global.Service
    if (input.list) {
      const folders = WorkspaceTrust.list(global.state)
      process.stdout.write((folders.length > 0 ? folders.join(EOL) : "Etibar edilmiş qovluq yoxdur.") + EOL)
      return
    }
    const target = Option.getOrUndefined(input.directory)
    const folder = target ? path.resolve(target) : projectRoot(process.cwd())
    if (input.remove) {
      WorkspaceTrust.untrust(global.state, folder)
      process.stdout.write(`Etibar götürüldü: ${folder}${EOL}`)
    } else {
      WorkspaceTrust.trust(global.state, folder)
      process.stdout.write(`Etibar edildi: ${folder}${EOL}`)
    }
    process.stdout.write(`İşləyən sessiyalar üçün konfiqurasiyanı yenilə: xudu-code reload${EOL}`)
  }),
)
