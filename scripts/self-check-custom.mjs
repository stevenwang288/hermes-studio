#!/usr/bin/env node
/**
 * 自研功能存活自检 —— 合并上游后必跑。
 *
 * 用法：node scripts/self-check-custom.mjs
 *
 * 逐项 grep 自研命点，确认没有被上游合并吃掉。
 * 注：③「路径完整显示(workspace-badge)」已于 2026-10-16 主动移除（上游已具备该能力，改随上游）。
 *     编号 ①-⑧ 保留不复用，便于对照历史记账。
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
    key: 'loadDesktopZoomLevel',
    file: 'packages/desktop/src/main/index.ts',
    label: '② 桌面字体缩放',
  },
  {
    key: 'DEFAULT_LINK_OPEN_TARGET',
    file: 'packages/client/src/utils/desktop-browser.ts',
    label: '④ 链接默认走系统浏览器',
  },
  {
    key: 'findChromeExecutable',
    file: 'packages/desktop/src/main/index.ts',
    label: '④ 强制 Chrome',
  },
  {
    key: 'getZoomFactor',
    file: 'packages/desktop/src/main/browser/browser-manager.ts',
    label: '④ 内置浏览器 zoom 错位修复',
  },
  {
    key: 'ALLOW_ALL_USERS',
    file: 'packages/server/src/modules/hermes/controllers/weixin.ts',
    label: '⑤ 微信扫码 DM 策略',
  },
  {
    key: 'toolCallDelta.id ||',
    file: 'packages/ekko-agent/src/model/providers/openai-compatible.ts',
    label: '⑥ 流式 tool_calls 空串修复',
  },
  {
    key: '_ALWAYS_EAGER',
    file: 'packages/server/src/modules/hermes/services/bridge/python/hermes_bridge.py',
    label: '⑦ update_plan/任务卡 MCP 常驻',
  },
  {
    key: '384000',
    file: 'packages/server/src/modules/coding-agents/services/context-policy.ts',
    label: '⑧ 商汤 384000 output cap',
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
  const r = spawnSync('git', ['grep', '-c', c.key, 'HEAD', '--', c.file], {
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
