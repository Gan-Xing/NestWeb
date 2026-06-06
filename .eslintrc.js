module.exports = {
	root: true,
	env: {
		jest: true,
		node: true
	},
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
	ignorePatterns: ['coverage', 'dist', 'node_modules'],
	rules: {
		'@typescript-eslint/ban-ts-comment': 'warn',
		'@typescript-eslint/no-empty-function': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-unused-vars': [
			'warn',
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_'
			}
		],
		'prefer-const': 'warn'
	}
};
