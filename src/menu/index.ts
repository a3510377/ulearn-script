export const createSettingsMenu = () => {
  const menu = document.createElement('div');
  menu.id = 'settings-menu';
  menu.style.cssText = `
    position: fixed;
    top: 50px;
    right: 20px;
    width: 200px;
    background: rgba(0,0,0,0.85);
    color: #fff;
    padding: 10px;
    border-radius: 8px;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 99999;
  `;

  menu.innerHTML = `
    <h4 style="margin:0 0 8px 0;">NFU 設定</h4>
    <label>播放速度:
      <input type="number" id="playbackRateInput" min="0.25" max="16" step="0.05">
    </label>
    <br/>
    <label>
      <input type="checkbox" id="autoNextCheckbox"> 自動跳下一個
    </label>
  `;

  document.body.appendChild(menu);

  // const rateInput = menu.querySelector<HTMLInputElement>('#playbackRateInput')!;
  // const autoNextCheckbox =
  //   menu.querySelector<HTMLInputElement>('#autoNextCheckbox')!;

  return () => {};
};
