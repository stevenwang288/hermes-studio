#!/usr/bin/env node
/**
 * verify-fleet.mjs — 4 台 PVE 的 Hermes Studio 浏览器端功能验收
 *
 * 用途：每次升级 4 台 PVE 后，用真实浏览器打开 Web UI，发一道加法题，
 *      确认 AI 正确回复。这是"升级是否真的可用"的最终验收。
 *
 * 用法：
 *   node scripts/verify-fleet.mjs          # 验收全部 4 台
 *   node scripts/verify-fleet.mjs 935      # 只验收 935
 *
 * 依赖（本机一次性准备）：
 *   mkdir -p /tmp/cdp-tool && cd /tmp/cdp-tool
 *   npm init -y && npm install playwright-core
 *
 * 前置：一个带 CDP 的 Chrome 必须与本脚本同一命令内启动（否则进程会被回收）：
 *   chrome.exe --remote-debugging-port=9222 --user-data-dir=<tmp> --headless=new about:blank &
 *
 * 三个已踩过的坑（别再重复）：
 *   1. 发送不能用键盘 Enter —— 必须点 button.send-button
 *   2. 首次登录会弹「请修改默认账户和密码」遮罩，挡住所有点击 —— 必须先点「稍后提醒」关掉
 *   3. 检测回复必须只读"新增的 div.message.assistant"，否则会被历史消息里的数字误判
 */

const { chromium } = require('playwright-core');

const VMS = [
  { id: '931', url: 'http://192.168.9.31:8648', dir: '/opt/hermes-studio-ekko' },
  { id: '935', url: 'http://192.168.9.35:8648', dir: '/opt/hermes-studio' },
  { id: '936', url: 'http://192.168.9.36:8648', dir: '/opt/hermes-studio-fork' },
  { id: '961', url: 'http://192.168.9.61:8648', dir: '/opt/hermes-studio' },
];

const LOGIN = { user: 'admin', pass: '123456' };
const CDP = 'http://127.0.0.1:9222';

async function verifyOne(ctx, vm) {
  const page = await ctx.newPage();
  const a = Math.floor(Math.random() * 80) + 11;
  const b = Math.floor(Math.random() * 80) + 11;
  const ans = a + b;
  const q = `${a} + ${b} 等于多少？只回答一个数字。`;
  const r = { id: vm.id, q, ans, ok: false, err: '', reply: '', ms: 0 };
  const t0 = Date.now();
  try {
    await page.goto(vm.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    if (await page.locator('input.login-input').count() >= 2) {
      await page.locator('input.login-input').nth(0).fill(LOGIN.user);
      await page.locator('input.login-input').nth(1).fill(LOGIN.pass);
      await page.locator('button').filter({ hasText: '登录' }).first().click();
      await page.waitForTimeout(10000);
    }

    // 坑 2：关闭「请修改默认账户和密码」遮罩，否则点击全被拦截
    const later = page.locator('.n-modal-container button').filter({ hasText: '稍后提醒' }).first();
    if (await later.count() > 0) {
      await later.click();
      await page.waitForTimeout(2500);
    }

    const ta = page.locator('textarea.input-textarea').first();
    await ta.waitFor({ timeout: 40000 });
    const before = await page.locator('div.message.assistant').count();

    await ta.fill(q);
    await page.waitForTimeout(1200);
    // 坑 1：必须点按钮，Enter 不发
    await page.locator('button.send-button').first().click({ timeout: 20000 });

    const deadline = Date.now() + 240000;
    let last = '';
    while (Date.now() < deadline) {
      await page.waitForTimeout(5000);
      // 坑 3：只看新增的 assistant 消息
      const cnt = await page.locator('div.message.assistant').count();
      if (cnt <= before) continue;
      const texts = await page.locator('div.message.assistant div.msg-content').allInnerTexts();
      last = (texts[texts.length - 1] || '').trim();
      if (last && new RegExp('(^|[^0-9])' + ans + '([^0-9]|$)').test(last)) { r.ok = true; break; }
      if (last && /已停止|出错了|Error|失败/.test(last)) break;
    }
    r.reply = last.slice(-200);
    await page.screenshot({ path: `C:/Users/baba1/AppData/Local/Temp/verify-${vm.id}.png` });
  } catch (e) {
    r.err = e.message;
  }
  r.ms = Date.now() - t0;
  await page.close();
  return r;
}

(async () => {
  const only = process.argv[2];
  const targets = only ? VMS.filter(v => v.id === only) : VMS;
  if (!targets.length) { console.error('未知节点: ' + only); process.exit(1); }

  const browser = await chromium.connectOverCDP(CDP);
  const ctx = browser.contexts()[0];
  const results = [];
  for (const vm of targets) {
    const r = await verifyOne(ctx, vm);
    results.push(r);
    console.log(`[${r.id}] ${r.ok ? '✅ 通过' : '❌ 失败'}  ${r.err ? 'ERR=' + r.err : ''}  (${(r.ms/1000).toFixed(1)}s)`);
    if (r.reply) console.log(`     题: ${r.q}  期望 ${r.ans} → 回复: ${r.reply.replace(/\n/g, ' | ')}`);
  }

  console.log('\n===== 验收汇总 =====');
  results.forEach(r => console.log(`  ${r.id}: ${r.ok ? '✅' : '❌'}  ${r.q}  期望 ${r.ans}`));
  const pass = results.filter(r => r.ok).length;
  console.log(`  通过 ${pass}/${results.length}`);
  await browser.close();
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
