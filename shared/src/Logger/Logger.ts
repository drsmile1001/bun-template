import { enumLiterals } from "~shared/utils/TypeboxHelper";

export const logLevelEnum = enumLiterals([
  "debug",
  "info",
  "warn",
  "error",
  "devlog",
] as const);
export type LogLevel = typeof logLevelEnum.static;

export interface LoggerContext {
  [key: string]: unknown;
  event?: string;
  emoji?: string;
  error?: unknown;
}

export type TemplateLogger = (
  strings: TemplateStringsArray,
  ...values: any[]
) => void;

export interface Logger {
  readonly level: LogLevel;
  /**
   * 命名子 logger，會增加 logger path 層級並可附帶 context 與 logLevel 覆蓋。
   */
  extend(namespace: string, context?: LoggerContext, level?: LogLevel): Logger;

  /**
   * 只附加 context，回傳自己
   */
  append(context: LoggerContext): Logger;

  /** 結構化 log：pino 風格 */
  debug(context: LoggerContext, msg: string): void;
  info(context: LoggerContext, msg: string): void;
  warn(context: LoggerContext, msg: string): void;
  error(context: LoggerContext, msg: string): void;

  debug(msg: string): void;
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;

  /**
   * 使用 template string 的 logger，會自動將 context 轉為 __#=value 的格式
   */
  debug(context?: LoggerContext): TemplateLogger;
  info(context?: LoggerContext): TemplateLogger;
  warn(context?: LoggerContext): TemplateLogger;
  error(context?: LoggerContext): TemplateLogger;

  /**
   * 開發階段用，無格式限制，輸出醒目 tag
   */
  log(...args: any[]): void;
}
