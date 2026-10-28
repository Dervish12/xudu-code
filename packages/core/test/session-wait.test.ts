import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { Database } from "@xudu/core/database/database"
import { AppNodeBuilder } from "@xudu/core/effect/app-node-builder"
import { LayerNode } from "@xudu/util/effect/layer-node"
import { Bus } from "@xudu/core/bus"
import { Location } from "@xudu/core/location"
import { Project } from "@xudu/core/project"
import { AbsolutePath } from "@xudu/core/schema"
import { Session } from "@xudu/core/session"
import { SessionProjector } from "@xudu/core/session/projector"
import { SessionExecution } from "@xudu/core/session/execution"
import { SessionStore } from "@xudu/core/session/store"
import { testEffect } from "./lib/effect"
import { globalProjectNode } from "./lib/project"

const location = Location.Ref.make({ directory: AbsolutePath.make("/project") })
const awaited: Session.ID[] = []
const execution = Layer.mock(SessionExecution.Service, {
  awaitIdle: (sessionID) => Effect.sync(() => awaited.push(sessionID)),
})
const it = testEffect(
  AppNodeBuilder.build(
    LayerNode.group([Database.node, Bus.node, SessionProjector.node, SessionStore.node, Session.node]),
    [Project.node.replace(globalProjectNode), SessionExecution.node.replace(execution)],
  ),
)

describe("Session.wait", () => {
  it.effect("delegates to SessionExecution.awaitIdle", () =>
    Effect.gen(function* () {
      awaited.length = 0
      const sessions = yield* Session.Service
      const session = yield* sessions.create({ location })

      yield* sessions.wait(session.id)

      expect(awaited).toEqual([session.id])
    }),
  )
})
