import { recv, send, select } from './select'
import { UnboundedChannel } from './unbounded-channel'
import { BoundedChannel } from './bounded-channel'

describe('select', () => {
	it('returns immediately if operator is ready', async () => {
		const c1 = new UnboundedChannel<number>()
		const c2 = new UnboundedChannel<string>()

		let i = 0
		setTimeout(() => i++, 1)

		await select([recv(c1), send(c2, 'foo', () => (i = 36))])
		expect(i).toBe(36)
		expect(c2.length).toBe(1)
	})

	it('cancels un-settled operations if one of operation is settled', async () => {
		{
			const c1 = new UnboundedChannel<number>()
			const c2 = new UnboundedChannel<string>()

			await select([recv(c1), send(c2, 'foo'), send(c2, 'bar')])

			expect(c1.length).toBe(0) // It will be -1 if it is not canceled.
			expect(c2.length).toBe(1) // It will be  2 if it is not canceled.

			await c2.send('baz')
			await expect(c2.recv()).resolves.toBe('foo')
			await expect(c2.recv()).resolves.toBe('baz')
		}

		{
			const c1 = new UnboundedChannel<number>()
			const c2 = new UnboundedChannel<string>()

			setTimeout(() => {
				c2.send('foo')
			}, 1)

			await select([recv(c1), recv(c2), recv(c2)])

			expect(c1.length).toBe(0) // It will be -1 if it is not canceled.
			expect(c2.length).toBe(0) // It will be -1 if it is not canceled.

			await c2.send('bar')
			await expect(c2.recv()).resolves.toBe('bar')
		}

		{
			const c1 = new BoundedChannel<number>(0)
			const c2 = new BoundedChannel<string>(0)

			setTimeout(() => {
				c2.recv()
			}, 1)

			await select([recv(c1), send(c2, 'foo'), send(c2, 'bar')])

			expect(c1.length).toBe(0) // It will be -1 if it is not canceled.
			expect(c2.length).toBe(0) // It will be  1 if it is not canceled.
		}
	})

	it('invokes fallback function if callback function is undefined', async () => {
		const c = new UnboundedChannel<number>()

		setTimeout(() => c.send(42), 1)

		let i = 0
		await select([recv(c)], () => i++)
		expect(i).toBe(1)
	})

	it('settles if channel is closed', async () => {
		const c = new BoundedChannel<number>(0)

		setTimeout(() => c.close(), 1)

		let i = 0
		await select([recv(c, () => i++)])
		expect(i).toBe(1)
	})
})
