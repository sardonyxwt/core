import { defineConfig } from 'rollup';
import pkg from './package.json';
import path from 'path';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import visualizer from 'rollup-plugin-visualizer';
import cleaner from 'rollup-plugin-cleaner';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
    input: path.join(__dirname, 'src/index.ts'),
    output: [
        {
            file: pkg.main,
            format: 'cjs',
            sourcemap: isProd ? 'hidden' : 'inline',
        },
        {
            file: pkg.module,
            format: 'es',
            sourcemap: isProd ? 'hidden' : 'inline',
        },
    ],
    external: Object.keys(pkg.dependencies),
    plugins: [
        replace({
            preventAssignment: true,
            values: {
                'process.env.VERSION': JSON.stringify(
                    `${pkg.version} - ${new Date().toISOString()}`,
                ),
            },
        }),
        commonjs(),
        resolve(),
        typescript({
            tsconfig: path.join(__dirname, 'tsconfig.rollup.json'),
            typescript: require('ttypescript'),
            useTsconfigDeclarationDir: true,
        }),
        cleaner({
            targets: [path.join(__dirname, 'lib')],
        }),
        visualizer({
            filename: path.join(__dirname, 'report/stats.html'),
        }),
    ],
});
