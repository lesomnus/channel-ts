import { UnboundedChannel } from './unbounded-channel'
import { ClosedError } from './errors'

describe('UnboundedChannel', () => {
	test('length is subtracted by the number of recv() hanged', () => {
		const c = new UnboundedChannel<number>()

		c.recv()
		expect(c.length).toBe(-1)

		c.recv()
		expect(c.length).toBe(-2)
	})
})
