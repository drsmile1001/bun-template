import type { Logger } from "~shared/Logger";
import { type Plugin, definePlugin } from "~shared/PluginLoader";
import type { ServiceResolver } from "~shared/ServiceContainer";
import { ok } from "~shared/utils/Result";

class ClassPlugin
  implements
    Plugin<{
      Callback: (message: string) => void;
    }>
{
  name = "class-plugin";
  callback?: (message: string) => void;
  init(
    logger: Logger,
    resolver: ServiceResolver<{
      Callback: (message: string) => void;
    }>
  ) {
    this.callback = resolver.resolve("Callback");
    this.callback("Class plugin initialized");
    return ok();
  }
  dispose() {
    if (this.callback) {
      this.callback("Class plugin disposed");
    }
  }
}

export default definePlugin<{
  Callback: (message: string) => void;
}>(new ClassPlugin());
