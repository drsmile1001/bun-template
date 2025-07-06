import { $ } from "bun";

import { Type as t } from "@sinclair/typebox";
import type { CAC } from "cac";
import { format } from "date-fns";
import { existsSync } from "fs";

import { buildConfigFactoryEnv } from "~shared/ConfigFactory";
import type { Logger } from "~shared/Logger";
import { type Result, err, isErr, ok } from "~shared/utils/Result";

const getSubtreeManagerConfig = buildConfigFactoryEnv(
  t.Object({
    TOOL_SUBTREE_REMOTE: t.String(),
    TOOL_SUBTREE_NAME: t.String(),
    TOOL_SUBTREE_LOCAL: t.Optional(t.String()),
  })
);

export function registerSubtreeManager(cli: CAC, baseLogger: Logger): void {
  function buildContext() {
    const { TOOL_SUBTREE_REMOTE, TOOL_SUBTREE_LOCAL, TOOL_SUBTREE_NAME } =
      getSubtreeManagerConfig();
    const manager = new SubtreeManager(baseLogger, {
      name: TOOL_SUBTREE_NAME,
      remote: TOOL_SUBTREE_REMOTE,
      remoteBranch: "main",
      local: TOOL_SUBTREE_LOCAL,
    });

    return {
      manager,
    };
  }

  cli.command("subtree:init", "配置共用程式碼").action(async () => {
    const { manager } = buildContext();
    await manager.init();
  });

  cli.command("subtree:pull", "更新共用程式碼").action(async () => {
    const { manager } = buildContext();
    await manager.pull();
  });

  cli
    .command("subtree:push", "將本地共用程式碼修改推送回上游")
    .action(async () => {
      const { manager } = buildContext();
      await manager.push();
    });
}

export class SubtreeManager {
  private readonly logger: Logger;
  private readonly name: string;
  private readonly remote: string;
  private readonly remoteBranch: string;
  private readonly local?: string;

  constructor(
    logger: Logger,
    options: {
      name: string;
      remote: string;
      remoteBranch: string;
      local?: string;
    }
  ) {
    this.logger = logger.extend("SubtreeManager");
    this.name = options.name;
    this.remote = options.remote;
    this.remoteBranch = options.remoteBranch;
    this.local = options.local;
  }

  async init() {
    const logger = this.logger.extend("init");
    logger.info({ emoji: "🔧" })`正在初始化 Subtree ${this.name}...`;
    if (existsSync(this.name)) {
      logger.warn()`Subtree 目錄 ${this.name} 已存在，跳過初始化`;
      return;
    }

    logger.info({
      emoji: "🔍",
    })`正在查詢 ${this.remote}/${this.remoteBranch} 上游提交`;
    const commitResult = await this.findRemoteCommit();
    if (isErr(commitResult)) {
      logger.error(`無法找到分支 ${this.remoteBranch} 的提交`);
      return;
    }
    const commit = commitResult.value;

    logger.info({
      emoji: "🌲",
    })`提交為 ${this.formatCommitHash(commit)} 開始 subtree add`;
    await $`git subtree add --prefix=${this.name} ${this.remote} ${this.remoteBranch} --squash`;
    const tag = this.formatTag(commit);
    await $`git tag ${tag}`;
    logger.info({ emoji: "🏷️" })`已建立 tag: ${tag}`;
    logger.info({ emoji: "🚀" })`Subtree ${this.name} 初始化完成`;
  }

  formatCommitHash(hash: string): string {
    return hash.length > 8 ? hash.substring(0, 8) : hash;
  }

  formatTag(commit: string) {
    const commitShort = this.formatCommitHash(commit);
    return `${this.name}@${commitShort}`;
  }

  async findRemoteCommit(): Promise<Result<string>> {
    const hashText =
      await $`git ls-remote ${this.remote} refs/heads/${this.remoteBranch}`;
    const [upstreamCommit] = hashText.stdout.toString().trim().split(/\s+/);
    if (!upstreamCommit) return err();
    return ok(upstreamCommit);
  }

  async getCurrentCommit(): Promise<string> {
    const result = await $`git rev-parse HEAD`;
    return result.stdout.toString().trim();
  }

  async pull() {
    const logger = this.logger.extend("pull", {
      emoji: "🔄",
    });
    logger.info()`正在更新 Subtree ${this.name}...`;
    if (!existsSync(this.name)) {
      logger.error(`Subtree 目錄 ${this.name} 不存在，請先初始化`);
      return;
    }

    logger.info({
      emoji: "🔍",
    })`正在查詢 ${this.remote}/${this.remoteBranch} 上游提交`;
    const commitResult = await this.findRemoteCommit();
    if (isErr(commitResult)) {
      logger.error(`無法找到分支 ${this.remoteBranch} 的提交`);
      return;
    }
    const upstreamCommit = commitResult.value;

    const before = await this.getCurrentCommit();

    logger.info()`提交為 ${this.formatCommitHash(upstreamCommit)} 開始 subtree pull`;
    await $`git subtree pull --prefix=${this.name} ${this.remote} ${this.remoteBranch} --squash`;

    const after = await this.getCurrentCommit();
    if (before === after) {
      logger.info({
        emoji: "✅",
      })`沒有新的更新，已是最新狀態`;
      return;
    }

    // 建立 tag 記錄更新點
    const tag = this.formatTag(upstreamCommit);
    await $`git tag ${tag}`;
    logger.info({ emoji: "🏷️" })`已建立 tag: ${tag}`;
    logger.info({ emoji: "🚀" })`Subtree ${this.name} 更新完成`;
  }

  async push() {
    const logger = this.logger.extend("push", {
      emoji: "🚀",
    });
    logger.info()`正在推送 Subtree ${this.name}...`;
    if (!existsSync(this.name)) {
      logger.error(`Subtree 目錄 ${this.name} 不存在，請先初始化`);
      return;
    }
    if (!this.local) {
      logger.error(`未指定本地名稱，跳過推送`);
      return;
    }

    const branch = `${this.local}/${format(new Date(), "yyyyMMdd-HHmmss")}`;

    logger.info({ emoji: "🌿" })`開始拆出 subtree 分支`;
    const result =
      await $`git subtree split --prefix=${this.name} -b ${branch}`;
    const newCommit = result.stdout.toString().trim();

    logger.info({
      emoji: "📤",
    })`已拆出 commit: ${this.formatCommitHash(newCommit)}`;

    logger.info({
      emoji: "🚀",
    })`推送至 ${this.remote}/${branch}`;
    await $`git push ${this.remote} ${branch}`;
    logger.info({ emoji: "✅" })`已推送至 ${this.remote}/${branch}`;
    await $`git branch -D ${branch}`;
    logger.info({ emoji: "🧹" })`已刪除本地中繼分支`;
    logger.info({ emoji: "🎉" })`Subtree ${this.name} 推送完成`;
  }
}
