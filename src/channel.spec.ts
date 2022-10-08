import { ClosedError } from './errors'
import { Channel } from './channel'
import { UnboundedChannel } from './unbounded-channel'
import { BoundedChannel } from './bounded-channel'

// type ChannelBuilder<T> = (capacity: number) => Channel<T>

describe('channel', () =>
	describe.each<{
		name: string
		make: <T>(capacity: number) => Channel<T>
			}>([
				{ name: 'UnboundedChannel', make: <T>() => new UnboundedChannel<T>() },
				{
					name: 'BoundedChannel',
					make: <T>(capacity: number) => new BoundedChannel<T>(capacity),
				},
			])('$name', ({ make }) => {
				it('cannot recv() or send(v) if closed', () => {
					const c = make(1)

					c.close()
					expect(() => c.recv()).toThrow(ClosedError)
					expect(() => c.send(42)).toThrow(ClosedError)
				})

				it('recv() immediately if data available', async () => {
					const c = make<number>(2)
					await c.send(42)
					await c.send(36)

					let i = 0
					setTimeout(() => {
						i++
					}, 1)

					await expect(c.recv()).resolves.toBe(42)
					await expect(c.recv()).resolves.toBe(36)
					expect(i).toBe(0)
				})

				it('send(v) immediately if buffer available', async () => {
					const c = make<number>(1)

					let i = 0
					setTimeout(() => {
						i++
					}, 1)

					await c.send(42)
					expect(i).toBe(0)
				})

				it('blocks recv() until data available', async () => {
					const c = make<number>(0)

					let i = 0
					setTimeout(() => {
						i++
						c.send(42)
					}, 1)

					await expect(c.recv()).resolves.toBe(42)
					expect(i).toBe(1)
				})

				it('throws on closed while recv()', async () => {
					const c = make<number>(0)

					let i = 0
					setTimeout(() => {
						i++
						c.close()
					}, 1)

					await expect(() => c.recv()).rejects.toThrow(ClosedError)
					expect(i).toBe(1)
				})

				it('signals the hanged recv() in order', async () => {
					const c = make<string>(0)
					let p = ''

					setTimeout(() => {
						c.send('jonathan')
						c.send(' joestar')
					}, 1)

					await c.recv().then((v) => (p += v))
					await c.recv().then((v) => (p += v))

					expect(p).toBe('jonathan joestar')
				})

				it('can recv() with async iterator', async () => {
					const c = make<string>(0)
					const ss = ['rick', 'zeep', 'kyle']

					c.send(ss[0])
					c.send(ss[1])
					c.send(ss[2])

					const received: string[] = []
					for await (const v of c) {
						received.push(v)

						if (received.length == ss.length) {
							break
						}
					}

					expect(received).toStrictEqual(ss)
				})

				test('ping pong', async () => {
					const c = make<number>(0)

					await expect(Promise.all([c.send(42), c.recv()])).resolves.toStrictEqual([undefined, 42])
					await expect(Promise.all([c.recv(), c.send(36)])).resolves.toStrictEqual([36, undefined])
				})
			}))
