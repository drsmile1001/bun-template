// setup.ts
import { readFile, writeFile, rm } from "fs/promises";
import { basename, resolve } from "path";

// 取得目前資料夾名稱作為 package.json 的 name
const dir = process.cwd();
const projectName = basename(dir);
const pkgPath = resolve(dir, "package.json");
const selfPath = resolve(dir, "setup.ts");

const pkgRaw = await readFile(pkgPath, "utf-8");
const pkg = JSON.parse(pkgRaw);
pkg.name = projectName;

await writeFile(pkgPath, JSON.stringify(pkg, null, 2));

console.log(`📦 專案名稱已設為 "${projectName}"，開始清理 setup.ts`);

setTimeout(async () => {
  try {
    await rm(selfPath);
    console.log("🧹 已刪除 setup.ts");
  } catch (err) {
    console.warn("⚠️ 無法刪除 setup.ts：", err);
  }
}, 500);
