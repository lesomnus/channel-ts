export class CircularQueue<T> {
	static from<T> (iterable: Iterable<T> | ArrayLike<T>, capacity?: number): CircularQueue<T> {
		const buffer = Array.from(iterable)
		if (capacity === undefined) {
			capacity = buffer.length
		} else if (capacity < buffer.length) {
			throw new RangeError('capacity must be equal or greater than length of the iterable')
		} 


		const q = new CircularQueue<T>(capacity)
		q.#buffer = capacity > buffer.length ?  buffer.concat(new Array(capacity - buffer.length)) : buffer
		q.#size = buffer.length

		return q
	}

	constructor(capacity: number){
		this.#buffer = new Array<T>(capacity)
	}

	get capacity(): number {
		return this.#buffer.length
	}

	get length(): number {
		return this.#size
	}

	push(value: T): void {
		if(this.length >= this.capacity){
			throw new Error('full')
		}

		const i = (this.#head  + this.#size) % this.capacity
		this.#buffer[i] = value
		this.#size++
	}

	shift(): T {
		if(this.length <= 0){
			throw new Error('empty')
		}

		const i = this.#head
		this.#head = (this.#head + 1) % this.capacity
		this.#size--

		return this.#buffer[i]
	}

	#buffer: T[]
	
	#size = 0
	#head = 0
}
