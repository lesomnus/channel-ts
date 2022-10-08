import { Channel } from './channel'
import { CancelableDeferred } from './deferred'

class OpCtx {
	tick(fn: () => void): boolean {
		if (!this.#done) {
			this.#done = true
			this.beforeTick()
			fn()
			return true
		} else {
			return false
		}
	}

	beforeTick: () => void = () => {}

	#done = false
}

class Op<T> {
	constructor(channel: Channel<T>) {
		this.channel = channel
	}

	protected isReady?(): boolean

	protected execute?(ctx: OpCtx): Promise<void>

	channel: Channel<T>
}

class RecvOp<T> extends Op<T> {
	constructor(channel: Channel<T>, onCommit?: ((ok: true, value: T) => void) & ((ok: false, value: null) => void)) {
		super(channel)
		this.onCommit = onCommit
	}

	isReady(): boolean {
		return this.channel.length > 0
	}

	execute(ctx: OpCtx): Promise<void> {
		const d = this.channel.recv()
		d.then(
			(v) => ctx.tick(() => this.onCommit?.(true, v)),
			() => ctx.tick(() => this.onCommit?.(false, null))
		)

		return d as Promise<void>
	}

	onCommit?: ((ok: true, value: T) => void) & ((ok: false, value: null) => void)
}

class SendOp<T> extends Op<T> {
	constructor(channel: Channel<T>, value: T, onCommit?: (ok: boolean) => void) {
		super(channel)

		this.onCommit = onCommit
		this.value = value
	}

	isReady(): boolean {
		return this.channel.length < this.channel.capacity
	}

	execute(ctx: OpCtx): Promise<void> {
		const d = this.channel.send(this.value)
		d.then(
			(v) => ctx.tick(() => this.onCommit?.(true)),
			() => ctx.tick(() => this.onCommit?.(false))
		)

		return d
	}

	onCommit?: (ok: boolean) => void
	value: T
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
export function recv<T>(
	channel: Channel<T>,
	onCommit?: ((ok: true, value: T) => void) & ((ok: false, value: null) => void)
): RecvOp<T> {
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
export function send<T>(channel: Channel<T>, value: T, onCommit?: (ok: boolean) => void): SendOp<T> {
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
export async function select<T extends readonly unknown[]>(
	ops: [...{ [K in keyof T]: RecvOp<T[K]> | SendOp<T[K]> }],
	fallback?: () => void
): Promise<void> {
	const ctx = new OpCtx()
	for (const op of ops) {
		if (op.isReady()) {
			await op.execute(ctx)
			return
		}
	}

	if (fallback !== undefined) {
		fallback()
		return
	}

	const ds: CancelableDeferred<unknown>[] = []
	const cancel = () => ds.forEach((d) => d.cancel())

	ctx.beforeTick = cancel

	for (const op of ops) {
		const d = op.execute(ctx)
		if (!(d instanceof CancelableDeferred)) {
			throw new Error('logic error: expected that the operation will be deferred')
		}

		d.beforeResolve = cancel
		ds.push(d)
	}

	await Promise.race(ds).catch(() => {})
}
