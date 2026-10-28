export * as ModelCatalog from "./model-catalog.js"

import { ephemeral, inventory } from "./event.js"

const Refreshed = ephemeral({
  type: "model-catalog.refreshed",
  schema: {},
})
export const Event = { Refreshed, Definitions: inventory(Refreshed) }
