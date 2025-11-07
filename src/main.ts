import { initSettingsMenu } from './view/index';

import './style';

const main = async () => {
  const { host, pathname } = location;

  // 跳過 TronClass 官方首頁
  if (/(.+\.)?tronclass\.com(\.tw)?/.test(host) && pathname === '/') {
    return;
  }

  // Initialize all components
  try {
    initSettingsMenu();
  } catch (error) {
    console.error('Initialization error:', error);
  }

  // window.addEventListener('hashchange', () => main());
};

main();
