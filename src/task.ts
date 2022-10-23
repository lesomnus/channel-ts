import { Deferred } from './deferred'

interface Task<F extends CallableFunction>{
	isSettled: boolean

	execute: F
	abort(err: Error): void
}

export class RecvTask<T> implements Task<(value: T) => void> {
	constructor(deferred: Deferred<T>){
		this.#deferred = deferred
	}

	get isSettled(): boolean {
		return this.#isSettled || this.#deferred.isSettled
	}

	execute(value: T): void {
		this.#isSettled = true
		this.#deferred.resolve(value)
	}

	abort(err: Error): void {
		this.#isSettled = true
		this.#deferred.reject(err)
	}

	#isSettled = false
	#deferred: Deferred<T>
}

export class SendTask<T> implements Task<() => T> {
	constructor(value: T, deferred: Deferred<void>){
		this.#deferred = deferred
		this.#value = value
	}

	get isSettled(): boolean {
		return this.#isSettled || this.#deferred.isSettled
	}

	execute(): T {
		this.#isSettled = true
		this.#deferred.resolve()
		return this.#value
	}

	abort(err: Error): void {
		this.#isSettled = true
		this.#deferred.reject(err)
	}

	#isSettled = false
	#deferred: Deferred<void>
	#value: T
}
