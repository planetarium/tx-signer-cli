import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'app.ts',
  output: {
    dir: 'out',
    format: 'cjs',
    exports: 'named',
  },
  plugins: [nodeResolve({ preferBuiltins: true }), commonjs(), typescript()],
};
