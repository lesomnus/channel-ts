import { Channel } from './channel'
import { UnboundedChannel } from './unbounded-channel'
import { BoundedChannel } from './bounded-channel'

export class Chan<T> implements Channel<T> {
	/**
	 * Create a channel that is a buffer with no size limit.
	 *
	 * @remarks
	 * It is effectively equivalent to {@link ./unbounded-channel#UnboundedChannel}.
	 * `send` always returns immediately.
	 *
	 * @returns Channel with a size-unlimited buffer.
	 */
	constructor()
	/**
	 * Create a channel with a size-limited buffer.
	 *
	 * @remarks
	 * It is effectively equivalent to {@link BoundedChannel}.
	 * `send` may be deferred until the buffer is available.
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
