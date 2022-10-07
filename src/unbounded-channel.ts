import { ClosedError } from './errors'
import { CancelableDeferred } from './deferred'
import { Channel } from './channel'

export class UnboundedChannel<T> implements Channel<T> {
	static from<T>(iterable: Iterable<T> | ArrayLike<T>): UnboundedChannel<T> {
		const c = new UnboundedChannel<T>()
		c.#buffer = Array.from(iterable)

		return c
	}

	recv(): Promise<T> {
		this.#throwIfClosed()

		if (this.#buffer.length > 0) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return Promise.resolve(this.#buffer.shift()!)
		}

		const d = new CancelableDeferred<T>()
		this.#receivers.push(d)

		return d
	}

	send(value: T): Promise<void> {
		this.#throwIfClosed()

		while (this.#receivers.length > 0) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const d = this.#receivers.shift()!
			if (d.isCanceled) {
				continue
			} else {
				d.resolve(value)
				return Promise.resolve()
			}
		}

		this.#buffer.push(value)
		return Promise.resolve()
	}

	close(): Promise<void> {
		this.#isClosed = true
		this.#buffer = []

		for (const d of this.#receivers) {
			if (d.isCanceled) {
				continue
			} else {
				d.reject(new ClosedError())
			}
		}

		this.#receivers = []

		return Promise.resolve()
	}

	async *[Symbol.asyncIterator](): AsyncIterator<T> {
		try {
			while (true) {
				const value = await this.recv()
				yield value
			}
		} catch (e) {
			if (!(e instanceof ClosedError)) {
				throw e
			} else {
				return
			}
		}
	}

	get capacity(): number {
		return Infinity
	}

	get length(): number {
		this.#receivers = this.#receivers.filter((d) => !d.isCanceled)

		return this.#buffer.length - this.#receivers.length
	}

	#throwIfClosed() {
		if (this.#isClosed) {
			throw new ClosedError()
		}
	}

	#isClosed = false
	#buffer: T[] = []
	#receivers: CancelableDeferred<T>[] = []
}
