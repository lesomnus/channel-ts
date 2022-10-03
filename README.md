# channel-ts

TypeScript implementation of [Go channel](https://go.dev/ref/spec#Channel_types).

## Features

- Select
- Async iterators
- Bounded/Unbounded channels

## Usage

### Send/Recv

```ts
import { BoundedChannel } from '@lesomnus/channel'

const c = new BoundedChannel<number>(0)

setTimeout(async () => {
	// Blocked until recv() since the size of the buffer is 0.
	await c.send(42)
}, 100)

// Blocked until send(42).
const answer = await c.recv()

// After 100ms...
answer === 42 // true
```

### Select

```ts
import { UnboundedChannel } from '@lesomnus/channel'
import { recv, send, select } from '@lesomnus/channel'

const c1 = new BoundedChannel<number>(0)
const c2 = new BoundedChannel<number>(0)

setTimeout(async () => { await c2.send(42) }, 100)

// After 100ms, "c2 received 42" will be logged.
await select([
	recv(c1, (v) => console.log('c1 received', v)),
	recv(c2, (v) => console.log('c2 received', v)),
])

// This blocks forever because the receive from c1 is effectively cancelled.
await c1.send(36)
```
