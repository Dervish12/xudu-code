import type { XuduEvent } from "@xudu/client"
import type { SelectedEvent, SubscribeOptions } from "@xudu/client/promise/api"

type EventType = Exclude<XuduEvent["type"], "server.connected">

export interface EventDomain {
  readonly subscribe: <Type extends EventType = EventType>(
    options?: SubscribeOptions<Type>,
  ) => AsyncIterable<SelectedEvent<XuduEvent, Type>>
}
