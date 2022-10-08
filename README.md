# channel

[![test](https://github.com/lesomnus/channel-ts/actions/workflows/test.yaml/badge.svg)](https://github.com/lesomnus/channel-ts/actions/workflows/test.yaml)
[![codecov](https://codecov.io/gh/lesomnus/channel-ts/branch/main/graph/badge.svg?token=sZSDd8Zzd7)](https://codecov.io/gh/lesomnus/channel-ts)

TypeScript implementation of [Go channel](https://go.dev/ref/spec#Channel_types).

## Features

-   Select
-   Async iterators
-   Bounded/Unbounded channels

## Usage

### Send/Recv

```ts
import { Chan } from '@lesomnus/channel'

const c = new Chan<number>(0) // Bounded channel with 0 size buffer.

setTimeout(async () => {
	// Blocked until recv() since the size of the buffer is 0.
	await c.send(42)
}, 100)

// Blocked until send(42).
const answer = await c.recv()

// After 100ms...
answer === 42 // true
```

```go
/* Golang equivalent. */

c := make(chan int)

go func(){ c <- 42 }()

answer := <- c
```

### Select

```ts
import { Chan } from '@lesomnus/channel'
import { recv, send, select } from '@lesomnus/channel'

const c1 = new Chan<number>(0)
const c2 = new Chan<number>(0)

setTimeout(async () => await c2.send(42), 100)

// After 100ms, "c2 received 42" will be logged.
await select([
	recv(c1, (v) => console.log('c1 received', v)),
	recv(c2, (v) => console.log('c2 received', v)),
])

// This blocks forever because the receive from c1 is effectively cancelled.
await c1.send(36)
```

```go
/* Golang equivalent. */

c1 := make(chan int)
c2 := make(chan int)

go func(){ c2 <- 42 }()

select {
	case v := <- c1: fmt.Println("c1 received", v)
	case v := <- c2: fmt.Println("c2 received", v)
}
```

### Async Iterate

```ts
import { Chan } from '@lesomnus/channel'

const c = Chan.from([42, 36], 2)

// Logs
// "received 42"
// "received 36"
// then blocked.
for await (const v of c){
	console.log('received', v)
}
```

```go
/* Golang equivalent. */

c := make(chan int, 2)
c <- 42
c <- 36

for v := range c {
	fmt.Println("received", v)
}
```
