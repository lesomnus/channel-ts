import { BoundedChannel } from './bounded-channel'
import { ClosedError } from './errors'

describe('BoundedChannel', () => {
	test('from existing buffer', async () => {
		const c = BoundedChannel.from([42, 36])

		expect(c.capacity).toBe(2)
		await expect(c.recv()).resolves.toBe(42)
		await expect(c.recv()).resolves.toBe(36)
	})

	test('from existing buffer with capacity', async () => {
		const c = BoundedChannel.from([42, 36], 3)

		expect(c.capacity).toBe(3)
		await c.send(3.14)
		await expect(c.recv()).resolves.toBe(42)
		await expect(c.recv()).resolves.toBe(36)
		await expect(c.recv()).resolves.toBe(3.14)
	})

	it('cannot have negative capacity', () => {
		expect(() => new BoundedChannel(-1)).toThrow()
	})

	it('blocks send(v) until buffer available', async () => {
		const c = new BoundedChannel<number>(0)

		let i = 0
		setTimeout(() => {
			i++
			c.recv()
		}, 1)

		await c.send(42)
		expect(i).toBe(1)
	})

	it('throws on closed while send(v)', async () => {
		const c = new BoundedChannel<number>(0)

		let i = 0
		setTimeout(() => {
			i++
			c.close()
		}, 1)

		await expect(() => c.send(42)).rejects.toThrow(ClosedError)
		expect(i).toBe(1)
	})

	it('signals the hanged send(v) in order', async () => {
		const c = new BoundedChannel<string>(0)
		let p = ''

		const done = Promise.all([
			c.recv().then((v) => (p += v)), //
			c.recv().then((v) => (p += v)),
		])

		await c.send('jonathan')
		await c.send(' joestar')

		await done
		expect(p).toBe('jonathan joestar')
	})

	test('length is subtracted by the number of the hanged recv()', () => {
		const c = new BoundedChannel<number>(0)

		c.recv()
		expect(c.length).toBe(-1)

		c.recv()
		expect(c.length).toBe(-2)
	})

	test('length is added by the number of the hanged send()', () => {
		const c = new BoundedChannel<number>(0)

		c.send(42)
		expect(c.length).toBe(1)

		c.send(36)
		expect(c.length).toBe(2)
	})
})
