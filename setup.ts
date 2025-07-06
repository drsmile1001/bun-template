import { readFile, rm, writeFile } from "fs/promises";
import { basename, resolve } from "path";

import { createDefaultLoggerFromEnv } from "~shared/Logger";

const logger = createDefaultLoggerFromEnv();
const dir = process.cwd();
const projectName = basename(dir);
const pkgPath = resolve(dir, "package.json");
const selfPath = resolve(dir, "setup.ts");

try {
  const pkgRaw = await readFile(pkgPath, "utf-8");
  const pkg = JSON.parse(pkgRaw);
  pkg.name = projectName;

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2));
  logger.info({
    emoji: "📦",
  })`專案名稱已設為 "${projectName}"`;

  setTimeout(async () => {
    try {
      await rm(selfPath);
      logger.info({
        emoji: "🧹",
      })`已刪除 setup.ts`;
    } catch (error) {
      logger.warn({
        error,
      })`無法刪除 setup.ts`;
    }
  }, 100);
} catch (error) {
  logger.error({
    error,
  })`無法讀取或寫入 package.json`;
}
