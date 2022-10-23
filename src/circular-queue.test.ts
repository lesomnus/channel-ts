import { CircularQueue } from './circular-queue'

describe('CircularQueue', () => {
	test('push and shift', () => {
		const q = new CircularQueue<number>(2)

		q.push(42)
		expect(q.shift()).toBe(42)
		expect(q.length).toBe(0)

		q.push(36)
		expect(q.shift()).toBe(36)
		expect(q.length).toBe(0)

		q.push(3.14)
		expect(q.shift()).toBe(3.14)
		expect(q.length).toBe(0)
	})

	test('full push', () => {
		const q = new CircularQueue<number>(2)

		q.push(42)
		q.push(36)
		expect(q.length).toBe(2)

		expect(q.shift()).toBe(42)
		expect(q.shift()).toBe(36)
		expect(q.length).toBe(0)
	})

	test('full push from middle', () => {
		const q = new CircularQueue<number>(2)

		q.push(3.14)
		expect(q.shift()).toBe(3.14)

		q.push(42)
		q.push(36)
		expect(q.length).toBe(2)

		expect(q.shift()).toBe(42)
		expect(q.shift()).toBe(36)
	})

	it('throws Error when push if it is full', () => {
		const q = new CircularQueue<number>(2)
		expect(q.capacity).toBe(2)

		q.push(42)
		q.push(36)
		expect(q.length).toBe(2)
		
		expect(() => q.push(3.14)).toThrowError('full')
		expect(q.length).toBe(2)
	})

	it('throws Error when shift if is is empty', () => {
		const q = new CircularQueue<number>(2)
		expect(q.length).toBe(0)

		expect(() => q.shift()).toThrowError('empty')
		expect(q.length).toBe(0)
	})

	test('construct from array', () => {
		const q = CircularQueue.from([42, 36, 3.14])
		expect(q.capacity).toBe(3)
		expect(q.length).toBe(3)
		
		expect(q.shift()).toBe(42)
		expect(q.shift()).toBe(36)
		expect(q.shift()).toBe(3.14)
	})

	test('construct from array with capacity', () => {
		const q = CircularQueue.from([42, 36, 3.14], 5)
		expect(q.capacity).toBe(5)
		expect(q.length).toBe(3)
		
		expect(q.shift()).toBe(42)
		expect(q.shift()).toBe(36)
		expect(q.shift()).toBe(3.14)
	})
})
