import { expect } from "bun:test";

import type { DeepPartial } from "~shared/utils/TypeHelper";

type SubsetMismatch = {
  path: string[];
  reason: string;
};

type Subsetable =
  | {
      [key: string]: unknown;
    }
  | {
      [key: number]: unknown;
    };

export function expectHasSubset<T extends Subsetable>(
  received: T,
  expected: DeepPartial<T>
): void {
  const errors = collectSubsetErrors(received, expected);

  if (errors.length > 0) {
    const errorList = errors.map((e) => `❌ ${e.path.join(".")}: ${e.reason}`);

    console.error("[Subset mismatch] Found errors:\n" + errorList.join("\n"));

    // 額外使用 Bun 的 expect 來顯示物件差異
    expect(received).toMatchObject(expected);
  }
}

function collectSubsetErrors<T extends Subsetable>(
  received: T,
  expected: DeepPartial<T>,
  path: string[] = []
): SubsetMismatch[] {
  const errors: SubsetMismatch[] = [];

  for (const [key, expectedValue] of Object.entries(expected)) {
    const currentPath = [...path, key];
    const actualValue = received?.[key as keyof T];

    if (expectedValue !== null && typeof expectedValue === "object") {
      if (actualValue === null || typeof actualValue !== "object") {
        errors.push({
          path: currentPath,
          reason: "Expected object, but got non-object",
        });
      } else {
        errors.push(
          ...collectSubsetErrors(actualValue as any, expectedValue, currentPath)
        );
      }
    } else {
      if (actualValue !== expectedValue) {
        errors.push({
          path: currentPath,
          reason: `Expected ${JSON.stringify(
            expectedValue
          )}, got ${JSON.stringify(actualValue)}`,
        });
      }
    }
  }

  return errors;
}
