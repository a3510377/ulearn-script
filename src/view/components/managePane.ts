import { settingsManager } from '@/managers';

import { buildRow } from './formElements';

import { createElement } from '#/dom';

export const buildManagePane = () => {
  const pane = createElement('div');

  pane.appendChild(
    buildRow({
      label: '匯出設定',
      desc: '下載設定為檔案',
      field: () => {
        const btn = createElement('button', 'mk-btn');

        btn.textContent = '匯出';
        btn.addEventListener('click', () => {
          settingsManager.downloadSettings?.();
        });

        return btn;
      },
    })
  );

  pane.appendChild(
    buildRow({
      label: '匯入設定',
      desc: '從檔案匯入設定',
      field: () => {
        const btn = createElement('button', 'mk-btn');

        btn.textContent = '匯入';
        btn.addEventListener('click', () => {
          settingsManager.importFromFile();
        });

        return btn;
      },
    })
  );

  pane.appendChild(
    buildRow({
      label: '重置所有設定',
      desc: '將所有設定恢復到預設值',
      field: () => {
        const btn = createElement('button', 'mk-btn');

        btn.textContent = '重置';
        btn.addEventListener('click', async () => {
          if (confirm('確定要重置所有設定嗎？')) {
            await settingsManager.resetAll();
          }
        });

        return btn;
      },
    })
  );

  return pane;
};
