// 每次執行：到台新「愛的力量」各提案頁抓目前累積票數，寫進 docs/data.json 當天那一筆。
// 由 GitHub Actions 定時執行（.github/workflows/fetch-votes.yml），也可以在本機用 `node scripts/fetch-votes.mjs` 測試。
import fs from "node:fs/promises";

const FILE = new URL("../docs/data.json", import.meta.url);
const END = Date.parse("2026-12-01T06:00:00+08:00"); // 投票 11/30 17:00 截止，之後不再抓
const URL_OF = (id) => `https://www.taishincharity.org.tw/lovepower/detail-report_${id}.html`;

if (Date.now() > END) {
  console.log("活動已結束，不再抓取。");
  process.exit(0);
}

const data = JSON.parse(await fs.readFile(FILE, "utf8"));
const ids = Object.keys(data.catalog);
const days = data.days || [];
const latest = {};
for (const d of days) for (const [id, v] of Object.entries(d.votes || {})) latest[id] = v;

function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, " ");
}

function parseVotes(html) {
  const text = textOf(html);
  // 優先找「目前累積票數」或「總票數」後面的數字
  const m = text.match(/(?:目前累積票數|總票數)\s*[:：]?\s*([\d,]+)\s*票?/);
  if (m) return parseInt(m[1].replace(/,/g, ""), 10);
  // 備用：頁面上第一個大於 10 的「N 票」（避開「一鍵投 10 票」之類的文字）
  for (const x of text.matchAll(/([\d,]+)\s*票/g)) {
    const n = parseInt(x[1].replace(/,/g, ""), 10);
    if (n > 10) return n;
  }
  return null;
}

async function fetchOne(id) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(URL_OF(id) + `?t=${Date.now()}`, {
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (CCF vote tracker)", "Cache-Control": "no-cache" },
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const n = parseVotes(await res.text());
      if (n == null) throw new Error("讀不到票數");
      return n;
    } catch (e) {
      if (attempt === 3) {
        console.warn(`✗ ${id} ${data.catalog[id]?.o}: ${e.message}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

// 同時最多 5 個請求，避免對台新網站造成負擔
const votes = {};
const queue = ids.slice();
await Promise.all(
  Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const id = queue.shift();
      const n = await fetchOne(id);
      if (n == null) continue;
      if (latest[id] != null && n < latest[id]) {
        console.warn(`! ${id} 票數比上次少（${latest[id]} → ${n}），保留上次的數字`);
        votes[id] = latest[id];
      } else votes[id] = n;
    }
  })
);

const ok = Object.keys(votes).length;
console.log(`抓到 ${ok} / ${ids.length} 筆`);
if (ok < ids.length * 0.5) {
  console.error("超過一半抓不到，這次不寫入資料。");
  process.exit(1);
}
// 抓不到的沿用上次數字，避免排行少人
for (const id of ids) if (votes[id] == null && latest[id] != null) votes[id] = latest[id];

const now = Date.now();
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
const entry = { date, ts: now, votes };
const i = days.findIndex((d) => d.date === date);
if (i >= 0) days[i] = entry;
else days.push(entry);
days.sort((a, b) => a.date.localeCompare(b.date));
data.days = days;
data.updatedAt = new Date(now).toISOString();

await fs.writeFile(FILE, JSON.stringify(data, null, 1) + "\n");

const us = ids.find((id) => /癌症關懷基金會/.test(data.catalog[id].o));
const ranked = ids.filter((id) => votes[id] != null).sort((a, b) => votes[b] - votes[a]);
if (us) console.log(`癌症關懷基金會：第 ${ranked.indexOf(us) + 1} 名，${votes[us]} 票；第 12 名 ${votes[ranked[11]]} 票`);
