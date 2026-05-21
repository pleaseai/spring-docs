import pleaseai from '@pleaseai/eslint-config'

export default pleaseai({
  typescript: true,
  ignores: [
    'markdown/**',
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '.please/**',
    '.husky/**',
  ],
})
