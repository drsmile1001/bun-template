import { Type as t } from "@sinclair/typebox";

import { buildConfigFactoryEnv, envBoolean } from "~shared/ConfigFactory";
import { logLevelEnum } from "~shared/Logger";

const getConfigFormEnv = buildConfigFactoryEnv(
  t.Object({
    TEST_LOGGER_LEVEL: t.Optional(logLevelEnum),
    TEST_SKIP_EVENT_BUS_TEST: t.Optional(envBoolean()),
  })
);

export const getTestConfig = () => {
  const config = getConfigFormEnv();
  return {
    TEST_LOGGER_LEVEL: config.TEST_LOGGER_LEVEL ?? "info",
    TEST_SKIP_EVENT_BUS_TEST: config.TEST_SKIP_EVENT_BUS_TEST ?? true,
  };
};
