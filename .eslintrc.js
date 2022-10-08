/** @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.eslint.json'],
	},
	plugins: [
		'@typescript-eslint',
		'eslint-plugin-tsdoc',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'plugin:@typescript-eslint/strict',
	],
	rules: {
		'semi': ['warn', 'never'],
		'comma-dangle': ['warn', 'always-multiline'],
		'quotes': ['warn', 'single'],
		'indent': ['warn', 'tab'],
		'object-curly-spacing': ['warn', 'always'],
		'block-spacing': ['warn', 'always'],
		'comma-spacing': ['warn', { 'before': false, 'after': true }],
		'arrow-spacing': ['warn', { 'before': true, 'after': true }],

		'tsdoc/syntax': 'warn',
		'@typescript-eslint/no-unused-vars': 'off',
		'@typescript-eslint/no-empty-function': 'off',
		'@typescript-eslint/no-floating-promises': 'off',
		'@typescript-eslint/no-unnecessary-condition': ['warn', {
			allowConstantLoopConditions: true,
		}],
		'@typescript-eslint/no-misused-promises': ['error', {
			checksVoidReturn: false,
		}],
	},
}
