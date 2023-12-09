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
        // enforces 2 spaces indent
        indent: [
            'error',
            2,
            {
                SwitchCase: 1,
                VariableDeclarator: { var: 2, let: 2, const: 3 },
                outerIIFEBody: 1,
                MemberExpression: 1,
                FunctionDeclaration: { parameters: 1, body: 1 },
                FunctionExpression: { parameters: 1, body: 1 },
                CallExpression: { arguments: 1 },
                ArrayExpression: 1,
                ObjectExpression: 1,
                ImportDeclaration: 1,
                flatTernaryExpressions: false,
                ignoreComments: false,
            },
        ],
    },
};
