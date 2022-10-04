import { UnboundedChannel } from './unbounded-channel'
import { ClosedError } from './errors'

describe('UnboundedChannel', () => {
	test('from existing buffer', async () => {
		const c = UnboundedChannel.from([42, 36])

		await expect(c.recv()).resolves.toBe(42)
		await expect(c.recv()).resolves.toBe(36)
	})

	test('length is subtracted by the number of recv() hanged', () => {
		const c = new UnboundedChannel<number>()

		c.recv()
		expect(c.length).toBe(-1)

		c.recv()
		expect(c.length).toBe(-2)
	})
})
