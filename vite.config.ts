import { LEARNING_PLATFORM_DOMAINS } from './const';

import { minify as htmlMinify } from 'html-minifier';
import * as lightningcss from 'lightningcss';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

const MINIFY = process.env.MINIFY === 'true';

const userScriptHeader = (version?: string) => `// ==UserScript==
// @name         一些 TronClass 功能
// @namespace    https://github.com/a3510377/ulearn-script
// @version      ${version || 'v0.0.0-dev'}
// @description  移除頁腳、修復部份樣式、繞過下載限制、繞過快轉限制、繞過複製限制、繞過畫面切換檢測、繞過全螢幕檢測等等，開發時使用 NFU ULearn，其它學校可能不適用
// @license      MIT
// @author       MonkeyCat
${LEARNING_PLATFORM_DOMAINS.map(
  (url) => `// @match        https://${url}/*`
).join('\n')}
// @match        https://coreyadam8.github.io/copyguard/
// @match        https://theajack.github.io/disable-devtool/
// @match        https://blog.aepkill.com/demos/devtools-detector/
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @run-at       document-start
// ==/UserScript==`;

const minifyCss = (content: string): string => {
  const cssString = lightningcss
    .transform({
      filename: '',
      code: Buffer.from(content),
      minify: true,
      targets: lightningcss.browserslistToTargets([
        '> 0.5%',
        'last 2 versions',
        'not dead',
      ]),
    })
    .code.toString();

  return cssString;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    // TODO move to plugins dir
    plugins: [
      {
        name: 'vite-plugin-minify-html-css-template',
        enforce: 'pre',
        transform(code: string, id: string) {
          if (!id.endsWith('.ts') && !id.endsWith('.tsx')) return null;

          const newCode = code.replace(
            /`(?:\$?(html|css))?((?:\\`|[^`])*)`/g,
            (match, prefix: string, content: string) => {
              try {
                let minified = content;
                if (prefix === 'html') {
                  minified = htmlMinify(content, {
                    collapseWhitespace: true,
                    removeComments: true,
                  });
                } else if (prefix === 'css') {
                  const vars: string[] = [];

                  content = content.replace(
                    /(\$?)\${\s*([^}]*)\s*}/g,
                    (_, prefix, expr) => {
                      const idx = vars.length;
                      vars.push(expr);
                      return prefix === '$'
                        ? `.__VAR_${idx}__{--t:0}`
                        : `__VAR_${idx}__`;
                    }
                  );

                  minified = minifyCss(content);

                  vars.forEach((expr, i) => {
                    const varUsageRegex = new RegExp(
                      `\\.__VAR_${i}__{--t:0}|__VAR_${i}__`,
                      'g'
                    );
                    minified = minified.replace(varUsageRegex, `\${${expr}}`);
                  });
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
        name: 'vite-plugin-minify-imported-raw-css',
        enforce: 'pre',
        async transform(code, id) {
          if (!id.endsWith('.css?raw')) return null;
          const rawCss = JSON.parse(
            code.match(/export default\s+(.*);?$/s)![1]
          );

          return {
            code: `export default ${JSON.stringify(minifyCss(rawCss))};`,
            map: null,
          };
        },
      },
      {
        name: 'vite-plugin-userscript-header',
        enforce: 'post',
        generateBundle(_options, bundle) {
          for (const fileName in bundle) {
            const chunk = bundle[fileName];
            if (chunk.type === 'chunk') {
              chunk.code = `${userScriptHeader(env.VITE_APP_VERSION)}\n\n${
                chunk.code
              }`;
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
      ...(MINIFY
        ? {
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
          }
        : { minify: false }),
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
  };
});
