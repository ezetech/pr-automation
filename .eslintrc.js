const { mergeSpellCheckDictionary } = require('@ezetech/eslint-config/mergeDictionary');

// keeps skip words exclusively for this repository
const localSkipWords = [
  'yaml',
  'Octokit',
  'repos',
  'repo',
  'tsconfig',
  'minimatch',
  'Vinny',
  'Chris',
  'Duffy',
  'Tobias',
  'Chet',
  'graphql',
];

// we merge skip words from shared config with local skip words
// because ESLint can't merge options from local rules with options from shared rules
const localSpellCheckRule = mergeSpellCheckDictionary(localSkipWords);

module.exports = {
  env: {
    node: true,
    es6: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  extends: ['@ezetech/eslint-config'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-empty-function': 'off',
    'security/detect-object-injection': 'off',
    'operator-linebreak': [
      'error',
      'after',
      { overrides: { '?': 'before', ':': 'before' } },
    ],
    'spellcheck/spell-checker': localSpellCheckRule,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
