import { defineConfig } from 'vite';
import * as lightningcss from 'lightningcss';
import { minify as htmlMinify } from 'html-minifier';
import path from 'path';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';

const userScriptHeader = `// ==UserScript==
// @name         一些 TronClass 功能
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  移除頁腳、修復部份樣式、繞過下載限制、繞過快轉限制、繞過複製限制、繞過畫面切換檢測、繞過全螢幕檢測等等，開發時使用 NFU ULearn，其它學校可能不適用
// @author       MonkeyCat
// @match        https://ulearn.nfu.edu.tw/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==`;

export default defineConfig({
  // TODO move to plugins dir
  plugins: [
    {
      name: 'vite-plugin-minify-html-css-template',
      enforce: 'pre',
      transform(code: string, id: string) {
        if (!id.endsWith('.ts') && !id.endsWith('.tsx')) return null;

        const newCode = code.replace(
          /`(?:\$?(html|css))?((?:\\`|[^`])*)`/g,
          (match, prefix, content) => {
            try {
              let minified = content;
              if (prefix === 'html') {
                minified = htmlMinify(content, {
                  collapseWhitespace: true,
                  removeComments: true,
                });
              } else if (prefix === 'css') {
                const cssString = lightningcss
                  .transform({
                    filename: '',
                    code: Buffer.from(content),
                    minify: true,
                  })
                  .code.toString();

                minified = postcss([
                  autoprefixer({
                    overrideBrowserslist: [
                      '> 0.5%',
                      'last 2 versions',
                      'not dead',
                    ],
                  }),
                ]).process(cssString).css;
              } else return match;

              // FIXME safe for backticks in content
              return '`' + minified + '`';
            } catch (err) {
              console.warn('Failed to minify template string:', err);
              return match;
            }
          }
        );

        return newCode;
      },
    },
    {
      name: 'vite-plugin-userscript-header',
      enforce: 'post',
      generateBundle(options, bundle) {
        for (const fileName in bundle) {
          const chunk = bundle[fileName];
          if (chunk.type === 'chunk') {
            chunk.code = `${userScriptHeader}\n\n${chunk.code}`;
          }
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '#': path.resolve(__dirname, 'src/utils'),
      '~': path.resolve(__dirname, 'src/store'),
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      mangle: true,
      compress: {
        drop_console: false,
        dead_code: false,
        keep_fnames: false,
        keep_classnames: false,
      },
      format: { comments: false },
    },
    lib: {
      entry: 'src/main.ts',
      name: 'ULearn',
      fileName: 'ULearn',
      formats: ['iife', 'es'],
    },
    rollupOptions: {
      external: ['angular'],
    },
  },
});
