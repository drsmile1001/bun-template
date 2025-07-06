import type { MaybePromise } from "~shared/utils/TypeHelper";

export interface EventBus<TEvents extends Events> {
  emit<TKey extends keyof TEvents>(
    name: TKey,
    payload: TEvents[TKey]
  ): Promise<void>;

  subscribe<TKey extends keyof TEvents>(
    name: TKey,
    handler: (payload: TEvents[TKey]) => MaybePromise<void>
  ): Promise<void>;
}

export type Events = Record<string, EventPayload>;
export type EventPayload = Record<string, unknown>;
