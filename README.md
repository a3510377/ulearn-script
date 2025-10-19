# 虎尾科技大學 uLeam/TronClass 數位學習平台功能擴充腳本

> 一個使用 TypeScript + Vite 建構的 uLearn 前端腳本專案。

![Script Settings](./docs/images/script-settings.png)

## 安裝與使用教學

### 環境需求

- Node.js 20 以上
- npm 或 yarn

### 安裝步驟

1. 下載或 clone 本專案：

```bash
git clone https://github.com/a3510377/ulearn-script.git
```

2. 進入專案資料夾：

```bash
cd my-school
```

3. 安裝依賴套件：

```bash
npm install
# 或
yarn install
```

4. 建置專案：

```bash
npm run build
# 或
yarn build
```

### 使用方式

1. 於瀏覽器安裝 [Tampermonkey](https://www.tampermonkey.net/) 擴充套件。
2. 將 `dist` 目錄下的腳本安裝到 Tampermonkey，或直接下載發布版本。
3. 進入虎尾科技大學 ULearn 平台，腳本將自動啟用。

### 注意事項

- 若有新功能需求或回報 bug，歡迎至 GitHub issue 留言。

## 功能列表

- `*`:
  - 移除頁腳
  - 移除 logo 錯誤 margin
  - 添加 menu 響應式 (尚未全部完成)
  - 繞過下載/快轉限制
  - 繞過複製/選取限制(js + css)
  - 繞過畫面切換檢測
  - 繞過全螢幕檢測
  - RWD 優化 (尚未全部完成)
- `/course/(?<learningID>\d+)(?<viewing>/learning-activity(/full-screen)?)?`:
  - 影片倍速播放
  - 影片自動播放下一集(可看百分之幾後自動跳下一集)
  - 右下角「設定懸浮球」：可即時調整腳本設定
    - **標籤頁式介面**：設定分為三大類別，切換更直覺
    - **功能開關**：移除頁腳、阻擋頁面切換檢測、啟用文字選取、RWD/樣式優化、強制允許下載
    - **影片設定**：自動下一個、播放速度、觸發比例與隨機偏移
    - **介面設定**：主題切換
    - **✨ 即時生效與復原**：所有功能開關可立即啟用/停用，無需重新載入頁面
- `/bulletin-list`:
  - 公告列表頁面課程名稱可點擊進入課程
- `/user/courses`
  - 課程列表頁面課程名稱可點擊進入課程

> 以上功能均以 **虎尾科技大學 (NFU) ULearn 平台** 為主要開發/測試環境，其他學校之 ULearn/TronClass 平台可能無法正常運作。

## 免責聲明

1. 本腳本僅供學術研究與學習用途，嚴禁用於任何非法或商業行為。
2. 本腳本會修改原始網站的部分行為，可能造成使用體驗與官方功能不一致，請自行斟酌使用。
3. 使用者必須自行承擔因使用本腳本所產生的一切後果，包括但不限於：帳號封鎖、資料遺失、系統異常。
4. 開發者對於因使用本腳本造成的任何直接或間接損失，概不負責。
5. 若有違反當地法律或學校規範之情形，責任由使用者自行承擔。
6. 本腳本於 **虎尾科技大學 ULearn 平台** 測試，其它學校或平台可能不適用，亦不保證功能可用。
