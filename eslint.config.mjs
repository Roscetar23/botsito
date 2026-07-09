import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // --- apps (composición): pueden importar feature modules de cualquier dominio ---
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:util', 'scope:shared'],
            },
            // --- por tipo (capas) ---
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:data-access',
                'type:ui',
                'type:model',
                'type:util',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:data-access', 'type:model', 'type:util', 'scope:shared'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:model', 'type:util', 'scope:shared'],
            },
            {
              sourceTag: 'type:model',
              onlyDependOnLibsWithTags: ['type:model', 'scope:shared'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util', 'type:model', 'scope:shared'],
            },
            // --- por dominio (scope) ---
            { sourceTag: 'scope:auth', onlyDependOnLibsWithTags: ['scope:auth', 'scope:shared'] },
            { sourceTag: 'scope:tasks', onlyDependOnLibsWithTags: ['scope:tasks', 'scope:shared'] },
            { sourceTag: 'scope:reminders', onlyDependOnLibsWithTags: ['scope:reminders', 'scope:shared'] },
            { sourceTag: 'scope:notifications', onlyDependOnLibsWithTags: ['scope:notifications', 'scope:shared'] },
            { sourceTag: 'scope:avatar', onlyDependOnLibsWithTags: ['scope:avatar', 'scope:shared'] },
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
  {
    // Modularidad estricta: ningún archivo de código supera 150 líneas.
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    ignores: ['**/*.spec.*', '**/*.test.*', '**/*.config.*', '**/jest.config.*'],
    rules: {
      'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
    },
  },
];
