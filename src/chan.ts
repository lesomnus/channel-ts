import { Channel } from './channel'
import { UnboundedChannel } from './unbounded-channel'
import { BoundedChannel } from './bounded-channel'

/**
 * @typeParam T - Type of element to hold
 */
export class Chan<T> implements Channel<T> {
	/**
	 * Creates a channel with the given data added to it.
	 *
	 * @typeParam T - Type of element to hold
	 * @param iterable - Elements to be added
	 * @returns Channel with a size-unlimited buffer.
	 */
	static from<T>(iterable: Iterable<T> | ArrayLike<T>): Chan<T>
	/**
	 * Creates a channel with the given data added to it.
	 *
	 * @typeParam T - Type of element to hold
	 * @param iterable - Elements to be added
	 * @param capacity - Number of elements channel can hold
	 * @returns Channel with a size-limited buffer.
	 *
	 * @throws RangeError
	 * Thrown if `capacity` is less than the length of `iterable`.
	 */
	// eslint-disable-next-line @typescript-eslint/unified-signatures
	static from<T>(iterable: Iterable<T> | ArrayLike<T>, capacity: number): Chan<T>
	static from<T>(iterable: Iterable<T> | ArrayLike<T>, capacity?: number): Chan<T> {
		if (capacity === undefined) {
			return UnboundedChannel.from(iterable)
		} else {
			return BoundedChannel.from(iterable, capacity)
		}
	}

	/**
	 * Creates a channel that is a buffer with no size limit.
	 *
	 * @remarks
	 * `send` always returns immediately.
	 *
	 * @returns Channel with a size-unlimited buffer.
	 */
	constructor()
	/**
	 * Creates a channel with a size-limited buffer.
	 *
	 * @remarks
	 * `send` is deferred until the buffer is available if buffer is full.
	 *
	 * @param capacity - Number of elements channel can hold
	 * @returns Channel with a size-limited buffer.
	 */
	// eslint-disable-next-line @typescript-eslint/unified-signatures
	constructor(capacity: number)
	constructor(capacity?: number) {
		if (capacity === undefined) {
			return new UnboundedChannel<T>()
		} else {
			return new BoundedChannel<T>(capacity)
		}
	}

	recv(): Promise<T> {
		throw new Error('Method not implemented.')
	}
	close(): Promise<void> {
		throw new Error('Method not implemented.')
	}
	send(value: T): Promise<void> {
		throw new Error('Method not implemented.')
	}
	[Symbol.asyncIterator](): AsyncIterator<T> {
		throw new Error('Method not implemented.')
	}
	get capacity(): number {
		throw new Error('Method not implemented.')
	}
	get length(): number {
		throw new Error('Method not implemented.')
	}
}
