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
	constructor(
		channel: Channel<T>,
		onCommit?: ((ok: true, value: T) => void) &
			((ok: false, value: null) => void)
	) {
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

	onCommit?: ((ok: true, value: T) => void) &
		((ok: false, value: null) => void)
}

class SendOp<T> extends Op<T> {
	constructor(
		channel: Channel<T>,
		value: T,
		onCommit?: (ok: boolean) => void
	) {
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

export function recv<T>(
	channel: Channel<T>,
	onCommit?: ((ok: true, value: T) => void) &
		((ok: false, value: null) => void)
): RecvOp<T> {
	return new RecvOp<T>(channel, onCommit)
}

export function send<T>(
	channel: Channel<T>,
	value: T,
	onCommit?: (err?: unknown) => void
): SendOp<T> {
	return new SendOp<T>(channel, value, onCommit)
}

export async function select<T extends readonly unknown[]>(
	ops: [...{ [K in keyof T]: RecvOp<T[K]> | SendOp<T[K]> }],
	fallback?: () => void
): Promise<void> {
	const ctx = new OpCtx()
	for (const op of ops) {
		if (op.isReady()) {
			if (op.onCommit === undefined) {
				op.onCommit = fallback
			}
			await op.execute(ctx)
			return
		}
	}

	const ds: CancelableDeferred<unknown>[] = []
	const cancel = () => ds.forEach((d) => d.cancel())

	ctx.beforeTick = cancel

	for (const op of ops) {
		if (op.onCommit === undefined) {
			op.onCommit = fallback
		}

		const d = op.execute(ctx)
		if (!(d instanceof CancelableDeferred)) {
			throw new Error(
				'logic error: expected that the operation will be deferred'
			)
		}

		// Make it more reasonable or rename class (e.g. synthetic promise? promise hook?).
		d.beforeResolve = cancel
		ds.push(d)
	}

	await Promise.race(ds).catch(() => {})
}
