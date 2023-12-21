module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
    ],
    plugins: [],
    rules: {
        'prettier/prettier': [
            'error',
            {
                useTabs: false, // ＼(￣▽￣)／
                tabWidth: 2,
                semi: true,
                singleQuote: true,
            },
        ],
        // allows unused vars when declared in arguments
        '@typescript-eslint/no-unused-vars': [
            'error',
            { vars: 'all', args: 'none' },
        ],
        // disables case checks for class/interface/type
        '@typescript-eslint/class-name-casing': 0,
        // disables case checks for properties
        '@typescript-eslint/camelcase': 0,
        // allows 'any' typehint
        '@typescript-eslint/no-explicit-any': 0,
    },
};
