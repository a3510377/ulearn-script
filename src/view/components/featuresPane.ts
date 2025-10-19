import { settingsManager } from '@/managers';
import settingsStore from '@/store/settings';

import { buildRow, buildToggle } from './formElements';

import { createElement } from '#/dom';

export const buildManagementBar = () => {
  const wrap = createElement('div', 'mk-settings-manage');

  const btnExport = createElement('button', 'mk-btn');
  btnExport.textContent = '匯出';
  btnExport.title = '匯出設定為檔案 (Ctrl+Shift+E)';
  btnExport.addEventListener('click', () => {
    settingsManager.downloadSettings();
  });

  const btnImport = createElement('button', 'mk-btn');
  btnImport.textContent = '匯入';
  btnImport.title = '從檔案匯入設定';
  btnImport.addEventListener('click', () => {
    settingsManager.importFromFile();
  });

  const btnReset = createElement('button', 'mk-btn');
  btnReset.textContent = '重置';
  btnReset.title = '重置所有設定 (Ctrl+Shift+R)';
  btnReset.addEventListener('click', () => {
    if (confirm('確定要重置所有設定嗎？')) {
      settingsManager.resetAll();
    }
  });

  wrap.append(btnExport, btnImport, btnReset);
  return wrap;
};

export const buildFeaturesPane = () => {
  const pane = createElement('div');

  pane.appendChild(
    buildRow({
      label: '移除頁腳',
      desc: '隱藏頁面底部的頁腳區域',
      field: () => buildToggle('removeFooter', settingsStore),
      kv: () => (settingsStore.get('removeFooter') ? '開啟' : '關閉'),
    })
  );

  pane.appendChild(
    buildRow({
      label: '阻擋頁面切換檢測',
      desc: '繞過全螢幕/視窗切換的檢測',
      field: () => buildToggle('blockEvents', settingsStore),
      kv: () => (settingsStore.get('blockEvents') ? '開啟' : '關閉'),
    })
  );

  pane.appendChild(
    buildRow({
      label: '啟用文字選取',
      desc: '允許複製與選取頁面文字',
      field: () => buildToggle('enableUserSelect', settingsStore),
      kv: () => (settingsStore.get('enableUserSelect') ? '開啟' : '關閉'),
    })
  );

  pane.appendChild(
    buildRow({
      label: 'RWD/樣式優化',
      desc: '響應式設計與介面優化',
      field: () => buildToggle('fixStyle', settingsStore),
      kv: () => (settingsStore.get('fixStyle') ? '開啟' : '關閉'),
    })
  );

  pane.appendChild(
    buildRow({
      label: '強制允許下載',
      desc: '繞過影片下載限制',
      field: () => buildToggle('allowDownload', settingsStore),
      kv: () => (settingsStore.get('allowDownload') ? '開啟' : '關閉'),
    })
  );

  return pane;
};
