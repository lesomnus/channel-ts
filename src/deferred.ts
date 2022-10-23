export class Deferred<T> implements Promise<T> {
	constructor() {
		let resolve_ = (value: T) => {}
		let reject_ = () => {}

		this.#promise = new Promise((resolve, reject) => {
			resolve_ = resolve
			reject_ = reject
		})

		this.#resolve = resolve_
		this.#reject = reject_
	}

	get isSettled(): boolean {
		return this.#isSettled
	}

	then<TResult1 = T, TResult2 = never>(
		onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
		onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined
	): Promise<TResult1 | TResult2> {
		return this.#promise.then(onfulfilled, onrejected)
	}

	catch<TResult = never>(
		onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null | undefined
	): Promise<T | TResult> {
		return this.#promise.catch(onrejected)
	}

	finally(onfinally?: (() => void) | null | undefined): Promise<T> {
		return this.#promise.finally(onfinally)
	}

	resolve(value: T): void {
		this.#isSettled = true
		this.onSettled()
		this.#resolve(value)
	}

	reject(reason?: unknown): void {
		this.#isSettled = true
		this.onSettled()
		this.#reject(reason)
	}

	readonly [Symbol.toStringTag] = 'Deferred'

	onSettled: () => void = () => {}

	#isSettled = false
	#resolve: (value: T) => void
	#reject: (reason?: unknown) => void
	#promise: Promise<T>
}
