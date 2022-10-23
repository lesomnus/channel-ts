import { Deferred } from './deferred'
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
