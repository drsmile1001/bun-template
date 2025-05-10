import { cac } from "cac";
import { $ } from "bun";
import { rm, rename } from "fs/promises";
import { join } from "path";

const cli = cac("bun-template");

cli
  .command("create <project>", "建立一個新專案")
  .option("--template <name>", "指定模板名稱", {
    default: "base",
  })
  .action(async (projectName: string, options: { template: string }) => {
    const template = options.template;
    const repo = "https://github.com/drsmile1001/bun-template";
    const tmpDir = `.tmp-${projectName}`;
    const templatePath = join(tmpDir, "templates", template);

    console.log(`🚧 建立專案 ${projectName}，使用模板 ${template}`);

    await $`git clone --depth 1 --filter=blob:none --sparse ${repo} ${tmpDir}`;

    // 進入暫存資料夾設定 sparse-checkout
    process.chdir(tmpDir);
    await $`git sparse-checkout set templates/${template}`;
    process.chdir("..");

    // 移動模板資料夾成為新專案目錄
    await rename(templatePath, projectName);

    // 移除暫存目錄
    await rm(tmpDir, { recursive: true, force: true });

    // 初始化 git 並安裝依賴
    process.chdir(projectName);
    await $`git init`;
    await $`bun install`;

    console.log(`✅ 專案 ${projectName} 建立完成。請進入資料夾並開始開發！`);
    console.log(`   cd ${projectName}`);
  });

cli.help();
cli.parse();
