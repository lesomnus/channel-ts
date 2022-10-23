import { ClosedError } from './errors'
import { Deferred } from './deferred'
import { RecvTask, SendTask } from './task'
import { CircularQueue } from './circular-queue'
import { Channel } from './channel'

export class BoundedChannel<T> implements Channel<T> {
	static from<T>(iterable: Iterable<T> | ArrayLike<T>, capacity?: number): BoundedChannel<T> {
		const q = CircularQueue.from(iterable, capacity)
		const c = new BoundedChannel<T>(q.capacity)
		c.#buffer = q

		return c
	}

	constructor(capacity: number) {
		if (capacity < 0) {
			throw new Error('capacity cannot be negative')
		}

		this.#buffer = new CircularQueue<T>(capacity)
	}

	get capacity(): number {
		return this.#buffer.capacity
	}

	get length(): number {
		this.#recvTasks = this.#recvTasks.filter((t) => !t.isSettled)
		this.#sendTasks = this.#sendTasks.filter((t) => !t.isSettled)

		return this.#buffer.length + this.#sendTasks.length - this.#recvTasks.length
	}

	recv(): Promise<T> {
		this.#throwIfClosed()

		if (this.#buffer.length > 0) {
			const v = this.#buffer.shift()
			const p = Promise.resolve(v)

			while (this.#sendTasks.length > 0) {
				const t = this.#sendTasks.shift()!
				if (t.isSettled) {
					continue
				}
				
				const v = t.execute()
				this.#buffer.push(v)
				break
			}

			return p
		}

		while (this.#sendTasks.length > 0) {
			const t = this.#sendTasks.shift()!
			if (t.isSettled) {
				continue
			}

			const v = t.execute()
			return Promise.resolve(v)
		}

		const d = new Deferred<T>()
		this.#recvTasks.push(new RecvTask(d))

		return d
	}

	send(value: T): Promise<void> {
		this.#throwIfClosed()

		if (this.#buffer.length < this.capacity) {
			this.#buffer.push(value)
			return Promise.resolve()
		}

		while (this.#recvTasks.length > 0) {
			const t = this.#recvTasks.shift()!
			if (t.isSettled) {
				continue
			} else {
				t.execute(value)
				return Promise.resolve()
			}
		}

		const d = new Deferred<void>()
		this.#sendTasks.push(new SendTask(value, d))

		return d
	}

	close(): Promise<void> {
		this.#isClosed = true

		for (const t of [...this.#recvTasks, ...this.#sendTasks]) {
			if (t.isSettled) {
				continue
			} else {
				t.abort(new ClosedError())
			}
		}

		this.#recvTasks = []
		this.#sendTasks = []

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

	#throwIfClosed() {
		if (this.#isClosed) {
			throw new ClosedError()
		}
	}

	#isClosed = false
	#buffer: CircularQueue<T>
	#recvTasks: RecvTask<T>[] = []
	#sendTasks: SendTask<T>[] = []
}
