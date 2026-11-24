# 愛的力量・投票追蹤（癌症關懷基金會）

第 17 屆台新「您的一票，決定愛的力量」社會福利 60 萬元組的投票追蹤網站，全部放在 GitHub：

- `docs/`：網站本體（`index.html` 畫面、`data.json` 每天的票數歷史）。由 GitHub Pages 發布。
- `scripts/fetch-votes.mjs`：到台新各提案頁抓目前累積票數，記進 `docs/data.json`。
- `.github/workflows/fetch-votes.yml`：每 3 小時自動抓票、存檔（留下歷史），再自動更新網站。
- 11/30 投票截止後（12/1 06:00 起）自動停止抓取，歷史資料會保留在網站上。

網址會是：`https://focusonccf2-stack.github.io/ccf-lovepower/`

## 一次性設定（約 10 分鐘）

### 1. 上傳檔案
1. 打開 `https://github.com/focusonccf2-stack/ccf-lovepower`，點「uploading an existing file」（或「Add file」→「Upload files」）。
2. 把解壓縮後資料夾裡的**所有檔案和資料夾**拖進去，按「Commit changes」。
3. 確認 repo 裡有 `.github/workflows/fetch-votes.yml`。
   有些電腦會隱藏開頭是「.」的資料夾，拖曳時可能漏掉。如果沒有：按「Add file」→「Create new file」，檔名輸入 `.github/workflows/fetch-votes.yml`，把本資料夾裡同名檔案的內容貼上後按「Commit changes」。

### 2. 開啟 GitHub Pages
repo 的「Settings」→ 左側「Pages」→「Build and deployment」的「Source」選 **GitHub Actions**。

### 3. 允許自動存檔
「Settings」→「Actions」→「General」→ 最下方「Workflow permissions」選 **Read and write permissions** →「Save」。

### 4. 先手動跑一次
「Actions」分頁（若出現提示，按啟用 workflows）→ 左邊「自動抓票並更新網站」→「Run workflow」。
約 1–2 分鐘後兩個步驟都變綠色勾勾就成功。點進「fetch」可以看到「癌症關懷基金會：第 N 名，X 票」。
完成後打開 `https://focusonccf2-stack.github.io/ccf-lovepower/` 就是網站。

之後完全自動，不用再做任何事。

## 注意
- 票數取自各提案頁，可能比官方「票數排行」頁慢，最終以官方公告為準。
- GitHub 的定時執行偶爾會延遲幾分鐘到十幾分鐘，屬正常現象。
- 「☆ 追蹤」和自訂比較的選擇存在各自的瀏覽器裡。
