import { definePlugin } from "~shared/PluginLoader";
import { ok } from "~shared/utils/Result";

export default definePlugin<{
  Callback: (message: string) => void;
}>({
  name: "object-plugin",
  init: (_logger, resolver) => {
    const callBack = resolver.resolve("Callback");
    callBack("Object plugin initialized");
    return ok();
  },
});
