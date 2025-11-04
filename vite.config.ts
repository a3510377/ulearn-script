import autoprefixer from 'autoprefixer';
import { minify as htmlMinify } from 'html-minifier';
import * as lightningcss from 'lightningcss';
import path from 'path';
import postcss from 'postcss';
import { defineConfig } from 'vite';

const userScriptHeader = `// ==UserScript==
// @name         一些 TronClass 功能
// @namespace    https://github.com/a3510377/ulearn-script
// @version      {VERSION_PLACEHOLDER}
// @description  移除頁腳、修復部份樣式、繞過下載限制、繞過快轉限制、繞過複製限制、繞過畫面切換檢測、繞過全螢幕檢測等等，開發時使用 NFU ULearn，其它學校可能不適用
// @license      MIT
// @author       MonkeyCat
// @match        https://tronclass.com.tw/*
// @match        https://ulearn.nfu.edu.tw/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
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
                const variableMap = new Map<string, string>();

                content = content.replace(
                  /\${\s*([^}]*)\s*}/g,
                  (_: unknown, p1: string) => {
                    if (!p1) return '';
                    if (!variableMap.has(p1)) {
                      variableMap.set(
                        p1,
                        '__tmp_class_' + Math.random().toString(36).slice(2)
                      );
                    }
                    return variableMap.get(p1)!;
                  }
                );

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

                for (const [key, tmp] of variableMap.entries()) {
                  minified = minified.replace(
                    new RegExp(tmp, 'g'),
                    `\${${key}}`
                  );
                }
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
      generateBundle(_options, bundle) {
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
    minify: false,
    // minify: 'terser',
    // terserOptions: {
    //   mangle: true,
    //   compress: {
    //     drop_console: false,
    //     dead_code: false,
    //     keep_fnames: false,
    //     keep_classnames: false,
    //   },
    //   format: { comments: false },
    // },
    lib: {
      entry: 'src/main.ts',
      name: 'ULearn',
      fileName: 'ULearn',
      formats: ['iife'],
    },
    rollupOptions: {
      external: ['angular'],
    },
  },
});
