// setup.ts - 專案初始化腳本，由 bun-create 執行
import { readFile, writeFile, rm } from "fs/promises";
import { basename, resolve } from "path";

// 🔧 根據目錄名稱設定 package.json 的 name
const dir = process.cwd();
const projectName = basename(dir);

const pkgPath = resolve(dir, "package.json");
const pkgRaw = await readFile(pkgPath, "utf-8");
const pkg = JSON.parse(pkgRaw);
pkg.name = projectName;

await writeFile(pkgPath, JSON.stringify(pkg, null, 2));

// 🧹 刪除自己
await rm(resolve(dir, "setup.ts"));
