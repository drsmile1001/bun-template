import { describe, expect, test } from "bun:test";

import { PluginLoader } from "~shared/PluginLoader";
import { StaticResolver } from "~shared/ServiceContainer";
import { buildTestLogger } from "~shared/testkit/TestLogger";

describe("PluginLoader", () => {
  test("可以載入插件與釋放插件", async () => {
    const logger = buildTestLogger();
    const message: string[] = [];
    const resolver = new StaticResolver({
      Callback: (msg: string) => {
        message.push(msg);
      },
    });
    const currentDir = import.meta.dir;
    const manager = new PluginLoader<{
      Callback: (message: string) => void;
    }>(logger, resolver, {
      pluginDir: `${currentDir}/fixture/plugins`,
    });
    await manager.load();
    expect(message).toContain("Object plugin initialized");
    expect(message).toContain("Class plugin initialized");
    await manager.dispose();
    expect(message).toContain("Class plugin disposed");
  });
});
