import { ClosedError } from './errors'
import { Deferred } from './deferred'
import { RecvTask } from './task'
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
			return Promise.resolve(this.#buffer.shift()!)
		}

		const d = new Deferred<T>()
		this.#recvTasks.push(new RecvTask(d))

		return d
	}

	send(value: T): Promise<void> {
		this.#throwIfClosed()

		while (this.#recvTasks.length > 0) {
			const t = this.#recvTasks.shift()!
			if (t.isSettled) {
				continue
			} else {
				t.execute(value)
				return Promise.resolve()
			}
		}

		this.#buffer.push(value)
		return Promise.resolve()
	}

	close(): Promise<void> {
		this.#isClosed = true
		this.#buffer = []

		for (const t of this.#recvTasks) {
			if (t.isSettled) {
				continue
			} else {
				t.abort(new ClosedError())
			}
		}

		this.#recvTasks = []

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
		return Infinity
	}

	get length(): number {
		this.#recvTasks = this.#recvTasks.filter((d) => !d.isSettled)

		return this.#buffer.length - this.#recvTasks.length
	}

	#throwIfClosed() {
		if (this.#isClosed) {
			throw new ClosedError()
		}
	}

	#isClosed = false
	#buffer: T[] = []
	#recvTasks: RecvTask<T>[] = []
}
