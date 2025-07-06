import kleur from "kleur";

import type { LogLevel, Logger, LoggerContext, TemplateLogger } from "./Logger";

type ColorPurpose = LogLevel | "stack";

export class LoggerConsole implements Logger {
  readonly level: LogLevel;

  static readonly priority: Record<LogLevel, number> = {
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    devlog: 5,
  };

  static readonly tags: Record<LogLevel, string> = {
    debug: "[DEBUG]",
    info: "[INFO] ",
    warn: "[WARN] ",
    error: "[ERROR]",
    devlog: "==DEV==",
  };

  static readonly consoleMethods: Record<LogLevel, (...data: any[]) => void> = {
    debug: (...data: any[]) => console.debug(...data),
    info: (...data: any[]) => console.info(...data),
    warn: (...data: any[]) => console.warn(...data),
    error: (...data: any[]) => console.error(...data),
    devlog: (...data: any[]) => console.log(...data),
  };

  static readonly colors: Record<ColorPurpose, (s: string) => string> = {
    debug: kleur.gray,
    info: kleur.cyan,
    warn: kleur.yellow,
    error: kleur.red,
    devlog: kleur.bgRed().yellow,
    stack: kleur.dim,
  };

  private renderColor(purpose: ColorPurpose, text: string): string {
    return this.withColor ? LoggerConsole.colors[purpose](text) : text;
  }

  constructor(
    level: LogLevel = "info",
    private readonly path: string[] = [],
    private context: LoggerContext = {},
    private readonly emojiMap: Record<string, string> = {},
    private readonly withEmoji: boolean = true,
    private readonly withColor: boolean = true,
    private readonly withContext: "inline" | "object" | false = "inline"
  ) {
    this.level = level;
  }

  extend(
    namespace: string,
    context: LoggerContext = {},
    overrideLevel?: LogLevel
  ): Logger {
    return new LoggerConsole(
      overrideLevel ?? this.level,
      [...this.path, namespace],
      { ...this.context, ...context },
      this.emojiMap,
      this.withEmoji,
      this.withColor,
      this.withContext
    );
  }

  append(context: LoggerContext): Logger {
    this.context = { ...this.context, ...context };
    return this;
  }

  debug(msg: string): void;
  debug(context: LoggerContext, msg: string): void;
  debug(context?: LoggerContext): TemplateLogger;
  debug(arg1?: any, arg2?: any): any {
    return this.write("debug", arg1, arg2);
  }

  info(msg: string): void;
  info(context: LoggerContext, msg: string): void;
  info(context?: LoggerContext): TemplateLogger;
  info(arg1?: any, arg2?: any): any {
    return this.write("info", arg1, arg2);
  }

  warn(msg: string): void;
  warn(context: LoggerContext, msg: string): void;
  warn(context?: LoggerContext): TemplateLogger;
  warn(arg1?: any, arg2?: any): any {
    return this.write("warn", arg1, arg2);
  }

  error(msg: string): void;
  error(context: LoggerContext, msg: string): void;
  error(context?: LoggerContext): TemplateLogger;
  error(arg1?: any, arg2?: any): any {
    let ctx = !arg1 || typeof arg1 === "string" ? {} : arg1;
    if (!ctx?.error) {
      ctx.error = new LoggerConsoleStackTracer();
    }
    if (!(ctx.error instanceof Error)) {
      ctx.error = new LoggerConsoleStackTracer(ctx.error);
    }
    const msg = typeof arg1 === "string" ? arg1 : arg2;
    return this.write("error", ctx, msg);
  }

  private write(level: LogLevel, msg: string): void;
  private write(level: LogLevel, context: LoggerContext, msg: string): void;
  private write(level: LogLevel, context?: LoggerContext): TemplateLogger;
  private write(level: LogLevel, arg1?: any, arg2?: any): any {
    if (!this.shouldLog(level)) return () => {};
    if (typeof arg1 === "string") return this.logMessage(level, {}, arg1);
    if (typeof arg2 === "string") return this.logMessage(level, arg1, arg2);
    const logger: TemplateLogger = (strings, ...values) =>
      this.shouldLog(level) &&
      this.logTemplate(level, arg1 ?? {}, strings, ...values);
    return logger;
  }

  private buildPrefix(level: LogLevel, messageContext: LoggerContext): string {
    const tag = this.renderColor(level, LoggerConsole.tags[level]);
    const emoji = this.getEmoji(level, messageContext);
    const eventText = messageContext.event ?? level;
    const pathText = this.path.join(":");
    return `${tag} ${emoji} ${pathText}:${eventText}:`;
  }

  private logMessage(
    level: LogLevel,
    context: LoggerContext,
    msg: string
  ): void {
    const prefix = this.buildPrefix(level, context);
    const line = `${prefix} ${msg}`;
    const consoleMethod = LoggerConsole.consoleMethods[level];
    if (!this.withContext) {
      consoleMethod(line);
    } else {
      const merged = { ...this.context, ...context };
      const writeContext = stripReserved(merged);
      if (this.withContext === "inline") {
        consoleMethod(`${line} ${JSON.stringify(writeContext)}`);
      } else if (this.withContext === "object") {
        consoleMethod(line, writeContext);
      }
    }
    if (context.error) this.logErrorObjectAndStack(context.error);
  }

  private logErrorObjectAndStack(error: any): void {
    let stack = "";
    if (error instanceof LoggerConsoleStackTracer) {
      stack = error.stack!.split("\n").slice(3).join("\n");
      if (error.value)
        console.error(
          this.renderColor("stack", `Error: ${JSON.stringify(error.value)}`)
        );
    } else if (error instanceof Error) {
      stack = error.stack ?? "";
    } else {
      this.log("設計錯誤", error);
    }
    console.error(this.renderColor("stack", stack));
  }

  private logTemplate(
    level: LogLevel,
    context: LoggerContext,
    strings: TemplateStringsArray,
    ...values: any[]
  ): void {
    const message = strings.reduce(
      (acc, s, i) =>
        acc + s + (i < values.length ? kleur.green(String(values[i])) : ""),
      ""
    );
    const ctx: LoggerContext = { ...context };
    values.forEach((v, i) => {
      ctx[`__${i}`] = v;
    });
    this.logMessage(level, ctx, message);
  }

  log(...args: any[]): void {
    const prefex = this.buildPrefix("devlog", {
      emoji: "💉",
    });
    LoggerConsole.consoleMethods["devlog"](prefex, ...[...args, this.context]);
  }

  private getEmoji(level: LogLevel, messageContext: LoggerContext): string {
    if (!this.withEmoji) return "";
    if (typeof messageContext.emoji === "string") return messageContext.emoji;
    if (messageContext.event && this.emojiMap[messageContext.event])
      return this.emojiMap[messageContext.event];
    if (level === "info" || level === "debug") {
      if (this.context.emoji) return this.context.emoji;
      if (this.emojiMap[level]) return this.emojiMap[level];
    } else {
      if (this.emojiMap[level]) return this.emojiMap[level];
      if (this.context.emoji) return this.context.emoji;
    }
    return "";
  }

  private shouldLog(level: LogLevel): boolean {
    return LoggerConsole.priority[level] >= LoggerConsole.priority[this.level];
  }
}

function stripReserved(ctx: LoggerContext): Record<string, unknown> {
  const { event, emoji, error, ...rest } = ctx;
  return rest;
}

class LoggerConsoleStackTracer extends Error {
  value: any;
  constructor(value?: any) {
    super();
    this.value = value;
  }
}
