import { LoggerConsole } from "~shared/Logger";

import { getTestConfig } from "./TestConfig";

export function buildTestLogger() {
  const { TEST_LOGGER_LEVEL } = getTestConfig();
  const logger = new LoggerConsole(TEST_LOGGER_LEVEL);
  return logger;
}
