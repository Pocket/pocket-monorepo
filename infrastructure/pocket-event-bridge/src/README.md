# PocketEventBridge

.aws contains infrastructure code for shared event bus, event-rules associated with it,
and shared consumers

## Folder structure

- `event-rules` contain the event-rule for any new events and their targets.
    we use `sns` as the target for event rule. Consumers can subscribe to the sns. event bridge
  allows only 5 targets per event rule. this `eventBus -> Sns -> Consumer` pattern allows us by-pass this limitation.
- `shared-consumers` contains any consumer of the events that have shared purpose.
  e.g snowplow consumer
- `events-schema` contains the schema registered with the schema registry `PocketEventBus`

## Architecture diagram

<https://miro.com/app/board/uXjVO5oHq_U=/>
