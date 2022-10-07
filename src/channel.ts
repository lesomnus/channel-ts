import { ClosedError } from './errors'

/**
 * Common interface for channel
 */
interface ChannelBase {
	/**
	 * Returns the number of elements that can be held.
	 * @readonly
	 */
	get capacity(): number

	/**
	 * Returns the number of elements that currently held.
	 * @readonly
	 *
	 * @remarks
	 * It can be negative or greater than capacity if receiver or sender hangs.
	 */
	get length(): number

	/**
	 * Closes the channel and raises `ClosedError` on currently hanging operations and all future operations.
	 */
	close(): Promise<void>
}

/**
 * Receive only channel.
 *
 * @typeParam T - Type of element to receive
 */
export interface Receiver<T> extends ChannelBase, AsyncIterable<T> {
	/**
	 * Removes the first element from the buffer and returns that element.
	 *
	 * @remarks
	 * It waits until element is available if buffer is empty.
	 *
	 * @throws {@link ClosedError}
	 * Thrown if channel is closed.
	 */
	recv(): Promise<T>
}

/**
 * Send only channel.
 *
 * @typeParam T - Type of element to send
 */
export interface Sender<T> extends ChannelBase {
	/**
	 * Adds an element to the end of the buffer.
	 *
	 * @remarks
	 * It waits until the buffer is available if the buffer is full.
	 *
	 * @param value - Element to add.
	 *
	 * @throws {@link ClosedError}
	 * Thrown if channel is closed.
	 */
	send(value: T): Promise<void>
}

/**
 * Channel is a message queue that allows asynchronous waiting for data.
 *
 * @typeParam T - Type of element to receive or send
 */
export interface Channel<T> extends Receiver<T>, Sender<T> {}
