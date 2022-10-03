import { Channel } from './channel'
import { CancelableDeferred } from './deferred'

class Op<T> {
	constructor(channel: Channel<T>) {
		this.channel = channel
	}

	protected isReady?(): boolean

	protected execute?(): Promise<void>

	channel: Channel<T>
}

class RecvOp<T> extends Op<T> {
	constructor(channel: Channel<T>, onCommit?: (err: any | null, value: T) => void) {
		super(channel)
		this.onCommit = onCommit
	}

	isReady(): boolean {
		return this.channel.length > 0
	}

	execute(): Promise<void> {
		const d = this.channel.recv()
		d.then(
			v => this.onCommit?.(null, v),
			e => this.onCommit?.(e, undefined as T))

		return d as Promise<void>
	}

	onCommit?: (err: any | null, value: T) => void
}

class SendOp<T> extends Op<T> {
	constructor(channel: Channel<T>, value: T, onCommit?: (err?: any) => void) {
		super(channel)

		this.onCommit = onCommit
		this.value = value
	}

	isReady(): boolean {
		return this.channel.length < this.channel.capacity
	}

	execute(): Promise<void> {
		const d = this.channel.send(this.value)
		d.then(
			() => this.onCommit?.(),
			e => this.onCommit?.(e))

		return d
	}

	onCommit?: (err?: any) => void
	value: T
}

export function recv<T>(channel: Channel<T>, onCommit?: (value: T) => void): RecvOp<T> {
	return new RecvOp<T>(channel, onCommit)
}

export function send<T>(channel: Channel<T>, value: T, onCommit?: () => void): SendOp<T> {
	return new SendOp<T>(channel, value, onCommit)
}

export async function select<T extends readonly any[]>(ops: [...({ [K in keyof T]: (RecvOp<T[K]> | SendOp<T[K]>) })], fallback?: () => void): Promise<void> {
	for (const op of ops) {
		if (op.isReady()) {
			if (op.onCommit === undefined) {
				op.onCommit = fallback
			}
			await op.execute()
			return
		}
	}

	const ds: CancelableDeferred<any>[] = []
	for (const op of ops) {
		if (op.onCommit === undefined) {
			op.onCommit = fallback
		}

		const d = op.execute()
		if (!(d instanceof CancelableDeferred)) {
			throw new Error('logic error: expected that the operation will be deferred')
		}

		ds.push(d)
	}

	await Promise.race(ds).catch(() => { })
	for (const d of ds) {
		d.cancel()
	}
}
