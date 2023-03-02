import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'app.js',
  output: {
    dir: 'output',
    format: 'cjs',
    globals: {
      'atob': '',
    },
  },
  plugins: [nodeResolve({ preferBuiltins: true }), commonjs()],
};
