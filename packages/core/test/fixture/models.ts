import { ModelCatalog } from "@xudu/core/model-catalog"

// Core is env-free, so the default ModelCatalog node refreshes from the model catalog
// unless the graph says otherwise. Real-Location fixtures opt out here; the
// test harness refuses any request that slips past.
export const offlineModels = ModelCatalog.node.replace(ModelCatalog.configured({ fetch: false }))
