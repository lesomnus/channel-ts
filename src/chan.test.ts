import { Chan } from './chan'
import { UnboundedChannel } from './unbounded-channel'
import { BoundedChannel } from './bounded-channel'

describe('Chan', () => {
	it('is UnboundedChannel if capacity is not given', () => {
		const c = new Chan()
		expect(c).toBeInstanceOf(UnboundedChannel)
	})

	it('is BoundedChannel if capacity is given', () => {
		const c = new Chan(42)
		expect(c).toBeInstanceOf(BoundedChannel)
	})
})
