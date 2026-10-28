import type { IntegrationInfo } from "@xudu/client"

export function hasConnectedProvider(integrations: readonly Pick<IntegrationInfo, "connections">[]) {
  return integrations.some((integration) => integration.connections.length > 0)
}
