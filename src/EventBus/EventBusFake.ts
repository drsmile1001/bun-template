import type { MaybePromise } from "~shared/utils/TypeHelper";

import type { EventBus, EventPayload } from "./EventBus";

export class EventBusFake<TEvents extends Record<string, EventPayload>>
  implements EventBus<TEvents>
{
  public readonly events: Array<{
    name: keyof TEvents;
    payload: TEvents[keyof TEvents];
  }> = [];

  private readonly handlers = new Map<
    keyof TEvents,
    Set<(payload: any) => MaybePromise<void>>
  >();

  async emit<TKey extends keyof TEvents>(
    name: TKey,
    payload: TEvents[TKey]
  ): Promise<void> {
    this.events.push({ name, payload });

    const set = this.handlers.get(name);
    if (set) {
      for (const handler of set) {
        await handler(payload);
      }
    }
  }

  async subscribe<TKey extends keyof TEvents>(
    name: TKey,
    handler: (payload: TEvents[TKey]) => MaybePromise<void>
  ): Promise<void> {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set();
      this.handlers.set(name, set);
    }
    set.add(handler);
  }

  clear(): void {
    this.events.length = 0;
  }

  getEmitted<TKey extends keyof TEvents>(name: TKey): TEvents[TKey][] {
    return this.events
      .filter(
        (e): e is { name: TKey; payload: TEvents[TKey] } => e.name === name
      )
      .map((e) => e.payload);
  }
}
