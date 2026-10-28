import type { XuduEvent } from "@xudu/client"
import { useClient } from "./client"

type EventMetadata = {
  directory: string | undefined
}
type XuduEventMap = { [Type in XuduEvent["type"]]: Extract<XuduEvent, { type: Type }> }

export function useEvent() {
  const client = useClient()

  function subscribe(handler: (event: XuduEvent, metadata: EventMetadata) => void) {
    return client.event.listen(({ details }) => {
      if (details.type === "server.connected") return
      handler(details, { directory: details.location?.directory })
    })
  }

  function on<T extends XuduEvent["type"]>(
    type: T,
    handler: (event: XuduEventMap[T], metadata: EventMetadata) => void,
  ) {
    return client.event.on(type, (event) => {
      handler(event, { directory: event.location?.directory })
    })
  }

  return {
    subscribe,
    on,
  }
}
