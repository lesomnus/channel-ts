import { Deferred, CancelableDeferred } from './deferred'
import { CanceledError } from './errors'

describe('Deferred', () => {
	test('resolve', async () => {
		let word = ''

		const d = new Deferred<string>()
		d.then((v) => (word = v))
		d.resolve('foo')

		await expect(d).resolves.toBe('foo')
		expect(word).toBe('foo')
	})

	test('reject', async () => {
		let word = ''

		const d = new Deferred<string>()
		d.catch((v) => (word = v as string))
		d.reject('bar')

		await expect(d).rejects.toBe('bar')
		expect(word).toBe('bar')
	})

	test('finally', async () => {
		let word = ''

		const d = new Deferred<string>()
		d.finally(() => (word = 'baz'))
		d.resolve('rick')

		await expect(d).resolves.toBe('rick')
		expect(word).toBe('baz')
	})

	test('await', async () => {
		const d = new Deferred<void>()
		setTimeout(() => d.resolve(), 0)

		await d
	})
})

describe('CancelableDeferred', () => {
	test('cancel', () => {
		let i = 0

		const d = new CancelableDeferred(() => i++)
		d.cancel()

		expect(d.isCanceled).toBe(true)
		expect(i).toBe(1)
	})

	it('resolve or reject throws if canceled', () => {
		const d = new CancelableDeferred<void>()
		d.cancel()

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		expect(() => d.resolve()).toThrow(CanceledError)
		expect(() => d.reject()).toThrow(CanceledError)
	})

	test('then', async () => {
		const d = new CancelableDeferred<string>()
		d.resolve('foo')

		await expect(d.then((v) => v)).resolves.toBe('foo')
	})
})
