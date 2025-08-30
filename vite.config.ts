import { defineConfig } from 'vite';
import * as csso from 'csso';
import { minify as htmlMinify } from 'html-minifier';
import path from 'path';

const userScriptHeader = `// ==UserScript==
// @name         一些 ULearn 功能
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  一些 ULearn 功能，主要於 NFU ULearn 測試
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

        const templateRegex = /`(?:\$?(html|css))?((?:\\`|[^`])*)`/g;
        const newCode = code.replace(
          templateRegex,
          (match, prefix, content) => {
            try {
              let minified = content;
              if (prefix === 'html') {
                minified = htmlMinify(content, {
                  collapseWhitespace: true,
                  removeComments: true,
                });
              } else if (prefix === 'css') {
                minified = csso.minify(content).css;
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
      mangle: {
        toplevel: true,
        properties: { regex: /^_/ },
        keep_classnames: false,
        keep_fnames: false,
      },
      compress: { toplevel: true, keep_fnames: false },
      format: { comments: false },
    },
    lib: {
      entry: 'src/main.ts',
      name: 'ULearn',
      fileName: 'ULearn',
      formats: ['iife', 'es'],
    },
  },
});
