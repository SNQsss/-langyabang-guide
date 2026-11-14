# 瑯琊榜人物誌

以海宴《琅琊榜》小說為依據的主題介紹網站，分為角色介紹與故事事件兩條內容線。網站文字使用繁體中文；電視劇劇照只作人物視覺素材，介紹設定以小說為準。

這份作業的核心是建立可持續使用的 `AGENTS.md`，並以實際網站驗證規則、文章範本與新增流程彼此一致。

## 目前版本：已完成靖王續作

2026-11-14 依專案文件實際新增靖王介紹。網站目前有首頁、梅長蘇、靖王、太子被廢共 4 頁，人物總覽仍為 12 位；梅長蘇與靖王各有完整介紹。原始首版的 3 頁基準保留於下方說明與驗證紀錄。

本輪修改的是「交付/GitHub上傳包」內這份專案，外層舊版專案與舊 ZIP 未同步。後續請以這份專案或由它產生的新 ZIP 為準。實際輸入、讀取文件、修正及前後成果見 [AI 續作紀錄](docs/ai-continuation.md)。

## 先看哪裡

- `AGENTS.md`：AI 接手工作前必讀的專案規則。
- `site/index.html`：可直接開啟的網站成品。
- `templates/`：角色與事件兩套文章範本。
- `content/`：可修改的文字資料；`web/`：共用版型與樣式。
- `docs/project-spec.md`：作業要求逐項對照。
- `docs/verification.md`：實際驗證結果。
- `docs/submission.md`：繳交內容，正式網址需在發布後填入。
- `交付/瑯琊榜人物誌_GitHub上傳包.zip`：不含小說全文的完整上傳包。

## 原始首版基準與後續界線

- 首頁：12 位角色圖片與不劇透基本介紹；只有梅長蘇有完整介紹入口。
- 角色：梅長蘇獨立頁，提供不劇透版與涵蓋全書的劇透版。
- 事件：太子被廢獨立頁。關閉劇透時，首頁不顯示事件名稱；直接開啟事件頁也先顯示提醒。
- 後續可新增靖王等角色、譽王叛亂等事件，首版不把所有題材一次做完。
- 不做心理剖析、問答機器人或完整百科。本站的劇透切換是閱讀提示，不是保密措施，原始 HTML 仍包含劇透內容。

## 本機瀏覽

只想看成果：直接開啟 `site/index.html`，不需安裝套件。核心文章、圖片與展開項目均為本機靜態檔案。檔案網址下的跨頁儲存行為依瀏覽器而異，完整的跨頁劇透狀態建議使用下列本機預覽。

修改內容時，使用 Node.js 18 以上。在專案根目錄依序執行：

```text
node scripts/build.mjs
node scripts/check.mjs
node scripts/serve.mjs
```

用瀏覽器開啟終端顯示的 `http://127.0.0.1:4173/`。修改內容後重新建置並重新整理頁面。停止預覽時在終端按 Ctrl+C。若 4173 被其他程式使用，可先設定環境變數 `PORT` 選擇其他埠號。

沒有第三方套件，無需 `npm install`。網站本身不呼叫生成式 AI API，也不需要金鑰。

## 新增角色：以靖王為例

本次已完成下列靖王示範，流程保留供查閱。再次修改靖王時，先讀現有文章；新增其他角色時請替換成對應代號，不覆蓋已完成的角色稿。

1. 請 AI 先讀 `AGENTS.md`、`templates/character.md` 與 `docs/source-notes.md`。
2. 核對小說資料，區分初登場公開資訊與後期劇透；若無對應文本，先補資料，不從既有簡介推演故事。
3. 靖王已有 `content/characters.json` 中的 `xiao-jingyan` 總覽項目與圖片，不要再建一張重複卡片。
4. 複製角色範本至 `content/characters/xiao-jingyan.md`，將 `id` 改成 `xiao-jingyan`，填入各欄位與兩個介紹區段。
5. 將實際來源登錄於 `content/sources.json`，替換範本中的 `SAFE01`、`SPOILER01`。`spoiler: false` 用於基本版來源，`true` 用於劇透版來源；不捏造段落。
6. 核對完成後，將 `status` 由 `draft` 改為 `published`，執行建置與檢查。
7. 網站會自動產生詳細頁，並在原有靖王卡片加入入口，不需修改首頁 HTML 或共用樣式。

若是全新的角色，先新增唯一代號的總覽資料與原圖，再依上述步驟處理。`imageSource` 只填實際來源網址；未知時保留 `null`。

## 新增事件：以譽王叛亂為例

1. 讀 `AGENTS.md` 與 `templates/event.md`，查找對應文本及前後文。
2. 複製範本至 `content/events/prince-yu-rebellion.md`，填入唯一代號、標題、摘要、封面角色代號、事件脈絡 `timeline` 及相關人物。
3. 依事件概述、背景、主要經過、直接結果撰寫；不要順帶完成其他事件支線。
4. 登錄實際來源，替換 `EVENT01`；核對完成後設為 `published`。
5. 執行建置與檢查。新事件會自動加入記事區，沿用原本的劇透提醒、共用版型及連結規則。

範本的頁首資料是包在 `---` 之間的 JSON。請保留雙引號、逗號與括號格式。正文支援二至四級標題、段落、`- ` 條列、粗體與來源錨點；不使用 HTML、表格或任意外部連結。

## 驗證可延伸性

```text
node scripts/check-extension.mjs
```

此工具在系統暫存目錄複製必要素材，實際使用兩套範本新增一個測試角色及事件，確認頁面與首頁入口自動產生，再改回草稿確認入口及舊頁移除。測試結束後清除自己的暫存目錄，不把測試題材留在正式網站。

`check.mjs` 檢查欄位、圖片、相對連結、頁面錨點及來源代號。若本機具有小說資料夾，也會核對章名與段落是否存在；公開包沒有全文時會明確說明略過此項。機械檢查只能確認格式與參照存在，情節是否忠於原文仍須人工核對。

## 自行上傳 GitHub 與發布

1. 執行 `node scripts/package.mjs` 更新上傳包；或直接使用已產生的 ZIP。
2. 解壓縮 `交付/瑯琊榜人物誌_GitHub上傳包.zip`。使用解壓後的內容上傳，不要把 ZIP 本身當成網站。
3. 建立自己的公開 Repository，將解壓後的完整專案檔案放在儲存庫根目錄。根目錄應直接看到 `AGENTS.md`、`README.md`、`index.html`、`.nojekyll` 及 `site/`，不要多包一層資料夾。
4. 在 Repository 的 Settings → Pages → Build and deployment，選擇 Deploy from a branch；分支選 `main`（若使用其他分支就選該分支），資料夾選 `/(root)`，儲存。
5. 根目錄 `index.html` 會帶到 `site/index.html`。等 GitHub 顯示部署完成，再用未登入的瀏覽視窗確認首頁、梅長蘇頁、靖王頁與事件頁正常。
6. 將實際 Repository 與網站網址填入本 README 末尾及 `docs/submission.md`。

發布設定依 [GitHub Pages 官方文件](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)（2026-11-14 查閱）。原始小說保留於本機且不在上傳包；若直接上傳整個桌面資料夾，`.gitignore` 不會自動替瀏覽器上傳過濾檔案，因此請使用交付包。

## 資料與待補事項

- 原文版本與來源：本機 `琅琊榜_RAG文本/README.md`，海宴《琅琊榜》修訂本。來源頁為 [好讀書目](https://www.haodoo.net/?M=book&P=16O9)；目前未宣稱已與出版原書逐字校對。
- 網站保存自行整理的介紹、章名與段落索引，不附原始全文。
- 12 張劇照由使用者提供，原始下載網址尚未提供；待取得後填入 `content/characters.json` 的 `imageSource`。未宣稱圖片為自製或已取得特定授權。
- GitHub Repository：https://github.com/SNQsss/-langyabang-guide
- 公開網站：https://snqsss.github.io/-langyabang-guide/site/index.html
