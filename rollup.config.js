import typescript from '@rollup/plugin-typescript'

/** @type {import('rollup').RollupOptions} */
export default {
	input: 'src/index.ts',
	output: {
		dir: 'dist',
		format: 'cjs',
		name: 'channel',
		sourcemap: true,
	},
	plugins: [
		typescript()
	],
}
