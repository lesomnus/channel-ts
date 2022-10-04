import { Channel } from './channel'
import { UnboundedChannel } from './unbounded-channel'
import { BoundedChannel } from './bounded-channel'

export class Chan<T> implements Channel<T> {
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
