#!/usr/bin/env node

let esbuild = require('esbuild')
let { nodeExternalsPlugin } = require('esbuild-node-externals')

Promise.all([
  esbuild.build({
    entryPoints: ['./src/index.ts'],
    outfile: 'dist/cjs.js',
    bundle: true,
    minify: false,
    format: 'cjs',
    platform: 'node',
    sourcemap: false,
    sourcesContent: false,
    target: 'node12',
    plugins: [nodeExternalsPlugin()],
  }),
  esbuild.build({
    entryPoints: ['./src/index.ts'],
    outfile: 'dist/esm.js',
    bundle: true,
    minify: false,
    format: 'esm',
    platform: 'node',
    sourcemap: false,
    sourcesContent: false,
    target: 'node14',
    plugins: [nodeExternalsPlugin()],
  }),
]).catch(error => {
  console.error(error)
  process.exit(1)
})

