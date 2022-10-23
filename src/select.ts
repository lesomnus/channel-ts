import { Channel } from './channel'
import { Deferred } from './deferred'
import { CanceledError } from './errors'

interface OpCtx {
	origin: Promise<void>
	next: Promise<void>
}

interface Op {
	isReady(): boolean

	execute(): {
		origin: Promise<void>
		next: Promise<void>
	}
}

class RecvOp<T> implements Op {
	constructor(channel: Channel<T>, onCommit?: ((ok: true, value: T) => void) & ((ok: false, value: null) => void)) {
		this.#channel = channel
		this.#onCommit = onCommit
	}

	isReady(): boolean {
		return this.#channel.length > 0
	}

	execute(): OpCtx {
		const d = this.#channel.recv()
		return {
			origin: d as Promise<void>,
			next: d.then(
				(v) => this.#onCommit?.(true, v),
				(err: unknown) => {
					if(err instanceof CanceledError){
						return
					}
	
					this.#onCommit?.(false, null)
				}
			),
		}
	}

	#channel: Channel<T>
	#onCommit?: ((ok: true, value: T) => void) & ((ok: false, value: null) => void)
}

class SendOp<T> implements Op {
	constructor(channel: Channel<T>, value: T, onCommit?: (ok: boolean) => void) {
		this.#channel = channel
		this.#value = value
		this.#onCommit = onCommit
	}

	isReady(): boolean {
		return this.#channel.length < this.#channel.capacity
	}

	execute(): OpCtx {
		const d = this.#channel.send(this.#value)
		return {
			origin: d,
			next: d.then(
				() => this.#onCommit?.(true),
				(err: unknown) => {
					if(err instanceof CanceledError){
						return
					}
					
					this.#onCommit?.(false)
				}
			),
		}
	}

	#channel: Channel<T>
	#value: T
	#onCommit?: (ok: boolean) => void
}

/**
 * Removes the first element from the given channel's buffer.
 *
 * @remarks
 * It must be used with {@link select}.
 * When the data is sent, `onCommit` is invoked with `ok` true and `value` received data.
 * If `channel` is closed, `onCommit` is invoked with `ok` false and `value` null.
 *
 * @example
 * ```
 * const c = new Chan<number>()
 * await select([
 * 	recv(c, (ok, v)=> ok && console.log('received', v))
 * ])
 * ```
 *
 * @param channel - Channel to remove element from.
 * @param onCommit - Invoked on operation settled.
 */
export function recv<T>(channel: Channel<T>, onCommit?: ((ok: true, value: T) => void) & ((ok: false, value: null) => void)): Op {
	return new RecvOp<T>(channel, onCommit)
}

/**
 * Adds an element to th end of given channel's buffer.
 *
 * @remarks
 * It must be used with {@link select}.
 * When the data is sent, `onCommit` is invoked with `ok` true.
 * If `channel` is closed, `onCommit` is invoked with `ok` false.
 *
 * @example
 * ```
 * const c = new Chan<number>()
 * await select([
 * 	send(c, 42, (ok)=> ok && console.log('sent'))
 * ])
 * ```
 *
 * @param channel - Channel to add element to.
 * @param value - Element to add.
 * @param onCommit - Invoked on operation settled.
 */
export function send<T>(channel: Channel<T>, value: T, onCommit?: (ok: boolean) => void): Op {
	return new SendOp<T>(channel, value, onCommit)
}

/**
 * Waits multiple channel operations.
 * It is similar to `Promise.race`.
 *
 * @remarks
 * It invokes `fallback` if all operations in `ops` are not ready and the operations are canceled.
 * If `fallback` is not given and `ops` is empty, it returns immediately unlike Go's select.
 *
 * @example
 * ```
 * const c1 = new Chan<number>()
 * const c2 = new Chan<number>()
 * await select([
 * 	recv(c1, (ok, v)=> ok && console.log('received', v))
 * 	send(c2, 42, (ok)=> ok && console.log('sent'))
 * ])
 * ```
 *
 * @param ops - Operations to wait.
 * @param fallback - Invoked if all operations in `ops` are not ready.
 */
export function select(ops: Op[], fallback?: () => void): Promise<void> {
	for (const op of ops) {
		if (!op.isReady()) {
			continue
		}

		return op.execute().next
	}

	if (fallback !== undefined) {
		fallback()
		return Promise.resolve()
	}

	const origins: Deferred<void>[] = []
	const commits: Promise<void>[] = []
	const cancel = () => origins.forEach((d) => {
		if(d.isSettled){
			return
		}
		d.reject(new CanceledError())
	})

	for (const op of ops) {
		const { origin, next } = op.execute()
		if (!(origin instanceof Deferred)) {
			throw new Error('logic error: expected that the operation is deferred')
		}

		origin.onSettled = cancel
		origins.push(origin as Deferred<void>)
		commits.push(next)
	}

	return Promise.race(commits).catch(() => {})
}
