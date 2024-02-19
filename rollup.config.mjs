import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json' with { type: "json" };

const config = {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'umd',
      sourcemap: true,
      name: 'LocalSpatialId',
    },
    {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    commonjs({
      requireReturnsDefault: "auto",
    }),
    typescript({ useTsconfigDeclarationDir: true }),
  ],
};
export default config;
