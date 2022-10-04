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

	describe('cancels un-settled operations if one of operation is settled', () => {
		test('by immediate operate', async () => {
			const c1 = new UnboundedChannel<number>()
			const c2 = new UnboundedChannel<string>()

			let sent = ''
			await select([
				recv(c1),
				send(c2, 'foo', () => (sent = 'foo')),
				send(c2, 'bar', () => (sent = 'bar')),
			])

			expect(c1.length).toBe(0) // It will be -1 if it is not canceled.
			expect(c2.length).toBe(1) // It will be  2 if it is not canceled.
			expect(sent).toBe('foo')

			await c2.send('baz')
			await expect(c2.recv()).resolves.toBe('foo')
			await expect(c2.recv()).resolves.toBe('baz')
		})

		test('by send', async () => {
			const c1 = new UnboundedChannel<number>()
			const c2 = new UnboundedChannel<string>()

			setTimeout(() => c2.send('foo'), 1)

			let i = 0
			await select([
				recv(c1),
				recv(c2, () => (i = 1)),
				recv(c2, () => (i = 2)),
			])

			expect(c1.length).toBe(0) // It will be -1 if it is not canceled.
			expect(c2.length).toBe(0) // It will be -1 if it is not canceled.
			expect(i).toBe(1)

			await c2.send('bar')
			await expect(c2.recv()).resolves.toBe('bar')
		})

		test('by send twice with unbounded channel', async () => {
			const c1 = new UnboundedChannel<number>()
			const c2 = new UnboundedChannel<string>()

			setTimeout(() => {
				c2.send('foo')
				c2.send('bar')
				c2.send('baz')
			}, 1)

			let i = 0
			await select([
				recv(c1),
				recv(c2, () => (i = 1)),
				recv(c2, () => (i = 2)),
			])

			expect(c1.length).toBe(0) // It will be -1 if it is not canceled.
			expect(c2.length).toBe(2) // It will be  1 if it is not canceled.
			expect(i).toBe(1)

			expect(c2.recv()).resolves.toBe('bar')
		})

		test('by send twice with bounded channel', async () => {
			const c1 = new BoundedChannel<number>(0)
			const c2 = new BoundedChannel<string>(0)

			setTimeout(() => {
				c2.send('foo')
				c2.send('bar')
				c2.send('baz')
			}, 1)

			let i = 0
			await select([
				recv(c1),
				recv(c2, () => (i = 1)),
				recv(c2, () => (i = 2)),
			])

			expect(c1.length).toBe(0) // It will be -1 if it is not canceled.
			expect(c2.length).toBe(2) // It will be  1 if it is not canceled.
			expect(i).toBe(1)

			expect(c2.recv()).resolves.toBe('bar')
		})

		test('by recv', async () => {
			const c1 = new BoundedChannel<number>(0)
			const c2 = new BoundedChannel<string>(0)

			let received = ''
			setTimeout(() => c2.recv().then((v) => (received = v)), 1)

			let sent = ''
			await select([
				recv(c1),
				send(c2, 'foo', () => (sent = 'foo')),
				send(c2, 'bar', () => (sent = 'bar')),
			])

			expect(c1.length).toBe(0) // It will be -1 if it is not canceled.
			expect(c2.length).toBe(0) // It will be  1 if it is not canceled.
			expect(sent).toBe('foo')
			expect(received).toBe('foo')

			c2.send('baz')
			expect(c2.recv()).resolves.toBe('baz')
		})

		test('by recv twice', async () => {
			const c1 = new BoundedChannel<number>(0)
			const c2 = new BoundedChannel<string>(0)

			let received = ''
			setTimeout(() => {
				c2.recv().then((v) => (received = v))
				c2.recv().then((v) => (received = v))
			}, 1)

			let sent = ''
			await select([
				recv(c1),
				send(c2, 'foo', () => (sent = 'foo')),
				send(c2, 'bar', () => (sent = 'bar')),
				send(c2, 'bar', () => (sent = 'baz')),
			])

			expect(c1.length).toBe(0) // It will be -1 if it is not canceled.
			expect(c2.length).toBe(-1) // It will be 1 if it is not canceled.
			expect(sent).toBe('foo')
			expect(received).toBe('foo')

			c2.send('bart')
			expect(c2.recv()).resolves.toBe('bart')
		})

		test('by close', async () => {
			const c1 = new BoundedChannel<number>(0)
			const c2 = new BoundedChannel<string>(0)

			setTimeout(() => c2.close(), 1)

			let sent = ''
			await select([
				recv(c1),
				send(c2, 'foo', () => (sent = 'foo')),
				send(c2, 'bar', () => (sent = 'bar')),
			])

			expect(c1.length).toBe(0) // It will be -1 if it is not canceled.
			expect(c2.length).toBe(0) // It will be  1 if it is not canceled.
			expect(sent).toBe('foo')
		})
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
