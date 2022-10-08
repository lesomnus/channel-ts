import { ClosedError } from './errors'
import { CancelableDeferred } from './deferred'
import { Channel } from './channel'

export class BoundedChannel<T> implements Channel<T> {
	static from<T>(iterable: Iterable<T> | ArrayLike<T>, capacity?: number): BoundedChannel<T> {
		const buffer = Array.from(iterable)
		if (capacity === undefined) {
			capacity = buffer.length
		} else if (capacity < buffer.length) {
			throw new RangeError('capacity must be equal or greater than length of the iterable')
		}

		const c = new BoundedChannel<T>(capacity)
		c.#buffer = buffer

		return c
	}

	constructor(capacity: number) {
		if (capacity < 0) {
			throw new Error('capacity cannot be negative')
		}

		this.#capacity = capacity
	}

	recv(): Promise<T> {
		this.#throwIfClosed()

		while (this.#senders.length > 0) {
			const d = this.#senders.shift()!
			if (d.isCanceled) {
				continue
			}

			d.resolve()
			if (this.#capacity === 0) {
				return new Promise<T>((resolve) => {
					d.then(() => resolve(this.#buffer.shift()!))
				})
			}
		}

		if (this.#buffer.length > 0) {
			return Promise.resolve(this.#buffer.shift()!)
		}

		const d = new CancelableDeferred<T>()
		this.#receivers.push(d)

		return d
	}

	send(value: T): Promise<void> {
		this.#throwIfClosed()

		if (this.#buffer.length < this.#capacity) {
			this.#buffer.push(value)
			return Promise.resolve()
		}

		while (this.#receivers.length > 0) {
			const d = this.#receivers.shift()!
			if (d.isCanceled) {
				continue
			} else {
				d.resolve(value)
				return Promise.resolve()
			}
		}

		const d = new CancelableDeferred<void>()
		d.then(() => this.#buffer.push(value)).catch((err) => {
			if (!(err instanceof ClosedError)) {
				throw new Error(`logic error: expected a ClosedError but was ${String(err)}`)
			}
		})
		this.#senders.push(d)

		return d
	}

	close(): Promise<void> {
		this.#isClosed = true
		this.#buffer = []

		for (const d of [...this.#receivers, ...this.#senders]) {
			if (d.isCanceled) {
				continue
			} else {
				d.reject(new ClosedError())
			}
		}

		this.#receivers = []
		this.#senders = []

		return Promise.resolve()
	}

	async *[Symbol.asyncIterator](): AsyncIterator<T> {
		try {
			while (true) {
				const value = await this.recv()
				yield value
			}
		} catch (e) {
			if (e instanceof ClosedError) {
				return
			}

			throw e
		}
	}

	get capacity(): number {
		return this.#capacity
	}

	get length(): number {
		this.#receivers = this.#receivers.filter((d) => !d.isCanceled)
		this.#senders = this.#senders.filter((d) => !d.isCanceled)

		return this.#buffer.length + this.#senders.length - this.#receivers.length
	}

	#throwIfClosed() {
		if (this.#isClosed) {
			throw new ClosedError()
		}
	}

	#isClosed = false
	#buffer: T[] = []
	#receivers: CancelableDeferred<T>[] = []
	#senders: CancelableDeferred<void>[] = []
	#capacity: number
}
