import { Type as t } from "@sinclair/typebox";

import type { Logger } from "~shared/Logger";
import type { ServiceMap, ServiceResolver } from "~shared/ServiceContainer";
import { type Result } from "~shared/utils/Result";
import type { MaybePromise } from "~shared/utils/TypeHelper";

export type Plugin<TServices extends ServiceMap = {}> = {
  name: string;
  init: (
    logger: Logger,
    resolver: ServiceResolver<TServices>
  ) => MaybePromise<Result<void, "SKIP" | "ERROR">>;
  dispose?: () => MaybePromise<void>;
};

export function definePlugin<TServices extends ServiceMap = {}>(
  plugin: Plugin<TServices>
): Plugin<TServices> {
  return plugin;
}

export const pluginSchema = t.Object({
  name: t.String(),
  init: t.Function([t.Optional(t.Any()), t.Optional(t.Any())], t.Any()),
  dispose: t.Optional(t.Function([], t.Any())),
});
