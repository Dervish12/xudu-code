export * as XuduWorkerd from "./workerd"

import { Layer } from "effect"
import type { Config, Scope } from "effect"
import { WorkerdProfile } from "../internal/workerd"
import { Xudu } from "./xudu"

export type Configuration = WorkerdProfile.Configuration

export interface CreateOptions<R = never> extends WorkerdProfile.Options {
  readonly log?: Xudu.CreateOptions["log"]
  readonly plugins?: Xudu.CreateOptions["plugins"]
  readonly workspaceProviders?: Xudu.CreateOptions["workspaceProviders"]
  readonly instances?: Xudu.CreateOptions<R>["instances"]
}

export const create = <R = never>({ log, plugins, workspaceProviders, instances, ...options }: CreateOptions<R>) => {
  const profile = WorkerdProfile.make(options)
  return Xudu.create(
    { ...profile.options, log, plugins, workspaceProviders, instances },
    { overrides: profile.replacements },
  )
}

export const layer = <R = never>(
  options: CreateOptions<R>,
): Layer.Layer<Xudu.Service, Config.ConfigError | Error, Exclude<R, Scope.Scope>> =>
  Layer.effect(Xudu.Service, create(options))

export type Interface = Xudu.Interface
export type Requirements = Scope.Scope
