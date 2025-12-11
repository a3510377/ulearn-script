import { GITHUB_REPO_URL, VERSION } from './constants';
import { featureManager } from './feature';
import { initSettingsMenu } from './view/index';

import './style';

const printArtLog = () => {
  const art = `%c
████████╗██████╗  ██████╗ ███╗   ██╗██╗   ██╗███╗   ██╗██╗      ██████╗  ██████╗ ██╗  ██╗
╚══██╔══╝██╔══██╗██╔═══██╗████╗  ██║██║   ██║████╗  ██║██║     ██╔═══██╗██╔════╝ ██║ ██╔╝
   ██║   ██████╔╝██║   ██║██╔██╗ ██║██║   ██║██╔██╗ ██║██║     ██║   ██║██║  ███╗█████╔╝ 
   ██║   ██╔══██╗██║   ██║██║╚██╗██║██║   ██║██║╚██╗██║██║     ██║   ██║██║   ██║██╔═██╗ 
   ██║   ██║  ██║╚██████╔╝██║ ╚████║╚██████╔╝██║ ╚████║███████╗╚██████╔╝╚██████╔╝██║  ██╗
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝

%cTronUnlock - ${VERSION}%c${GITHUB_REPO_URL}%c
`;

  console.log(
    art,
    'color:#00d4ff;font-weight:bold;font-size:8px;',
    'padding:5px 8px;background:#ee5566;color:#fff;border-radius:4px 0 0 4px;font-size:12px;',
    'padding:4.5px 8px;border:1px solid #ee5566;border-radius:0 4px 4px 0;',
    ''
  );
};

const main = async () => {
  const { host, pathname } = location;

  printArtLog();

  // 跳過 TronClass 官方首頁
  if (/(.+\.)?tronclass\.com(\.tw)?/.test(host) && pathname === '/') {
    return;
  }

  await featureManager.init();

  // Initialize all components
  try {
    initSettingsMenu();
  } catch (error) {
    console.error('Initialization error:', error);
  }

  // window.addEventListener('hashchange', () => main());
};

main();
