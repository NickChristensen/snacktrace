import tseslint from 'typescript-eslint'

export default tseslint.config({
  ignores: ['build/', 'node_modules/', 'coverage/'],
}, ...tseslint.configs.recommended)
