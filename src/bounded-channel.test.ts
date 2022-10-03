import { BoundedChannel } from './bounded-channel'
import { ClosedError } from './errors'

describe('BoundedChannel', () => {
	it('cannot have negative capacity', () => {
		expect(() => new BoundedChannel(-1)).toThrow()
	})

	it('blocks send(v) until buffer available', async () => {
		const c = new BoundedChannel<number>(0)

		let i = 0
		setTimeout(async () => { i++; await c.recv() }, 1);

		await c.send(42)
		expect(i).toBe(1)
	})

	it('throws on closed while send(v)', async () => {
		const c = new BoundedChannel<number>(0)

		let i = 0
		setTimeout(() => { i++; c.close() }, 1)

		await expect(() => c.send(42)).rejects.toThrow(ClosedError)
		expect(i).toBe(1)
	})

	it('signals the hanged send(v) in order', async () => {
		const c = new BoundedChannel<string>(0)
		let p = ''

		const done = new Promise<void>(resolve => {
			setTimeout(async () => {
				await c.recv().then(v => p += v)
				await c.recv().then(v => p += v)
				resolve()
			}, 1);
		})

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
