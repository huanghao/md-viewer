#!/usr/bin/env node
import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

const watch = process.argv.includes('--watch');

// Tailwind 只生成 React 组件用到的工具类（见 src/client/tailwind.css），
// 追加到 esbuild 产出的 client.css 之后，页面仍只引一个样式文件。
const tailwindPlugin: esbuild.Plugin = {
  name: 'tailwind-append',
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length > 0) return;
      const tmp = path.join('dist', 'tailwind.tmp.css');
      execFileSync(
        path.join('node_modules', '.bin', 'tailwindcss'),
        ['-i', 'src/client/tailwind.css', '-o', tmp, ...(watch ? [] : ['--minify'])],
        { stdio: ['ignore', 'ignore', 'inherit'] }
      );
      fs.appendFileSync(path.join('dist', 'client.css'), '\n' + fs.readFileSync(tmp, 'utf8'));
      fs.rmSync(tmp);
    });
  },
};

const buildOptions: esbuild.BuildOptions = {
  entryPoints: { client: 'src/client/main.ts' },
  bundle: true,
  outdir: 'dist',
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  sourcemap: true,
  minify: !watch,
  jsx: 'automatic',
  plugins: [tailwindPlugin],
};

async function build() {
  try {
    // 确保 dist 目录存在
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }

    // 独立拷贝，不走 esbuild CSS bundle：这个文件要单独作为一个可被
    // Shadow DOM 内 <link> 引用的小样式文件，不能被合并进 client.css
    // （否则 shadow root 里会连带引入 app 全局样式）。
    fs.copyFileSync(
      path.join('src/client/annotation-marks.css'),
      path.join('dist/annotation-marks.css')
    );

    if (watch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('👀 Watching for changes...');
    } else {
      await esbuild.build(buildOptions);
      console.log('✅ Build completed!');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
