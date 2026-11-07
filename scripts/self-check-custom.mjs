#!/usr/bin/env node
/**
 * 自研功能存活自检 —— 合并上游后必跑。
 *
 * 用法：node scripts/self-check-custom.mjs
 *
 * 逐项 grep 自研命点，确认没有被上游合并吃掉。
 * 2026-11-07 大哥拍板：本 fork **只保留两项**自研功能 —— ① 消息队列、② Windows 桌面字体缩放。
 * 其余（原 ③④⑤⑥⑦⑧⑨）全部撤销、回到上游原样，不再检查。
 * 编号保留不复用，便于对照历史记账。
 * 退出码：0 = 全部存活，1 = 有缺失（需要回去在第 2 步按冲突铁律重应用）。
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CHECKS = [
  {
    key: 'preempt',
    file: 'packages/server/src/modules/studio/sockets/chat-run.ts',
    label: '① 消息队列(服务端 preempt)',
  },
  {
    key: 'promote_all',
    file: 'packages/server/src/modules/studio/sockets/chat-run.ts',
    label: '① 消息队列(合并放行 promote_all)',
  },
  {
    key: 'queued_messages',
    file: 'packages/server/src/modules/studio/services/chat-run/abort.ts',
    label: '① 消息队列(abort 出队)',
  },
  {
    key: 'promoteQueuedMessage',
    file: 'packages/client/src/stores/hermes/chat.ts',
    label: '① 消息队列(前端 store)',
  },
  {
    key: 'promoteQueuedMessage',
    file: 'packages/client/src/components/hermes/chat/ChatInput.vue',
    label: '① 消息队列(输入框 ESC/Ctrl+Enter)',
  },
  {
    key: 'scrollToBottomCounter',
    file: 'packages/client/src/components/hermes/chat/MessageList.vue',
    label: '① 消息队列(放行后滚动到视野)',
  },
  {
    key: 'loadDesktopZoomLevel',
    file: 'packages/desktop/src/main/index.ts',
    label: '② 桌面字体缩放',
  },
];

function width(s) {
  let w = 0;
  for (const ch of s) {
    w += /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1;
  }
  return w;
}
function pad(s, n) {
  return s + ' '.repeat(Math.max(0, n - width(s)));
}

console.log('自研功能存活自检');
console.log('='.repeat(72));

// 折叠出各大项（同一功能的多个命中点合并显示）
const grouped = new Map();
const missing = [];

for (const c of CHECKS) {
  // 检查工作区实际内容（不带 rev），改完代码立刻能反映，不会因为查 HEAD 而假通过
  const r = spawnSync('git', ['grep', '-c', c.key, '--', c.file], {
    cwd: ROOT,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30000,
  });
  const n = Number((r.stdout || '').trim().split(':').pop());
  const count = Number.isFinite(n) ? n : 0;
  const ok = count > 0;

  const group = c.label.split(' ')[0]; // ①②③...
  if (!grouped.has(group)) grouped.set(group, { items: [], ok: true });
  const g = grouped.get(group);
  g.items.push({ ...c, count, ok });
  if (!ok) {
    g.ok = false;
    missing.push(c);
  }
}

for (const [group, g] of grouped) {
  const status = g.ok ? 'PASS' : 'FAIL';
  const detail = g.items.map((i) => `${i.count}×`).join(' / ');
  const first = g.items[0].label;
  console.log(`  ${status}  ${pad(first, 36)} ${detail}`);
}

const total = CHECKS.length;
const lost = missing.length;

console.log('');
console.log('='.repeat(72));
if (lost === 0) {
  console.log(`全部存活 ${total}/${total} 个命点 —— 自研功能完好，可以继续。`);
  process.exit(0);
} else {
  console.log(`丢失 ${lost}/${total} 个命点 —— 上游吃掉了自研代码，回去按冲突铁律重新应用：`);
  for (const m of missing) console.log(`   - ${m.label}  (${m.file} 搜不到 ${m.key})`);
  process.exit(1);
}
