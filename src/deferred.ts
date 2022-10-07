import { CanceledError } from './errors'

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
		this.beforeResolve()
		this.#resolve(value)
	}

	reject(reason?: unknown): void {
		this.#reject(reason)
	}

	readonly [Symbol.toStringTag] = 'Deferred'

	beforeResolve: () => void = () => {}

	#resolve: (value: T) => void
	#reject: (reason?: unknown) => void
	#promise: Promise<T>
}

export class CancelableDeferred<T> extends Deferred<T> {
	constructor(onCanceled?: () => void) {
		super()

		this.#onCanceled = onCanceled ?? (() => {})
	}

	resolve(value: T): void {
		this.#throwIfCanceled()
		super.resolve(value)
	}

	reject(reason?: unknown): void {
		this.#throwIfCanceled()
		super.reject(reason)
	}

	get isCanceled(): boolean {
		return this.#isCanceled
	}

	cancel() {
		if (!this.#isCanceled) {
			this.#isCanceled = true
			this.#onCanceled()
		}
	}

	#throwIfCanceled() {
		if (this.#isCanceled) {
			throw new CanceledError()
		}
	}

	#isCanceled = false
	#onCanceled: () => void
}
