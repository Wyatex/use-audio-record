import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['./src/index.ts', './src/vue.ts', './src/react.ts'],
  name: 'use-audio-record',
  sourcemap: true,
  declaration: true,
  externals: ['vue', 'react'],
  rollup: {
    emitCJS: true,
  },
})
