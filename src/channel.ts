interface ChannelBase {
	get capacity(): number
	get length(): number

	close(): Promise<void>
}

export interface Receiver<T> extends ChannelBase, AsyncIterable<T> {
	recv(): Promise<T>
}

export interface Sender<T> extends ChannelBase {
	send(value: T): Promise<void>
}

export interface Channel<T> extends Receiver<T>, Sender<T> {

}


