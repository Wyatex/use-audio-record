import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  name: 'use-audio-record',
  externals: ['vue', 'react'],
  rollup: {
    emitCJS: true,
  },
})
