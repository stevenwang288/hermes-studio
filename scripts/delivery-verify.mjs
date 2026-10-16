#!/usr/bin/env node
/**
 * 一条龙交付终检 —— 硬闸门。
 *
 * 用法：node scripts/delivery-verify.mjs
 *       node scripts/delivery-verify.mjs --skip-pve   # 本轮只更桌面版、PVE 不动时
 *
 * 自动校验 9 项交付指标，全部 PASS 才算「一条龙完成」。
 * --skip-pve：PVE 4 台的 commit/存活共 8 项标 SKIP 且不判 FAIL（大哥明确本轮不动 PVE 时用）。
 * 只要有一项 FAIL -> 回到 SYNC-CHECKLIST.md 补完那一步再重跑。
 * 退出码：0 = 全绿，1 = 有 FAIL。
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const VMS = [
  { id: '931', dir: '/opt/hermes-studio-ekko' },
  { id: '935', dir: '/opt/hermes-studio' },
  { id: '936', dir: '/opt/hermes-studio-fork' },
  { id: '961', dir: '/opt/hermes-studio' },
];

// ---------- 命令执行适配（Windows 上 ssh/powershell 可能只在某一层可用） ----------

function baseSpawn(file, args, opts = {}) {
  return spawnSync(file, args, {
    encoding: 'utf8',
    windowsHide: true,
    cwd: opts.cwd || ROOT,
    timeout: opts.timeout || 60000,
    shell: false,
  });
}

const SSH_OK = (() => {
  const r = baseSpawn(
    'ssh',
    ['-o', 'ConnectTimeout=6', '-o', 'BatchMode=yes', 'pve-vm-931', 'echo __ok__'],
    { timeout: 20000 }
  );
  return r.status === 0 && (r.stdout || '').includes('__ok__');
})();

const MODE = SSH_OK ? 'ssh-direct' : 'bash-wsl';

function sshOut(vm, remoteCmd) {
  if (SSH_OK) {
    const r = baseSpawn(
      'ssh',
      ['-o', 'ConnectTimeout=10', '-o', 'BatchMode=yes', `pve-vm-${vm}`, remoteCmd],
      { timeout: 45000 }
    );
    return (r.stdout || '') + (r.status !== 0 ? (r.stderr || '') : '');
  }
  const r = baseSpawn('bash', [
    '-lc',
    `ssh -o ConnectTimeout=10 -o BatchMode=yes pve-vm-${vm} ${JSON.stringify(remoteCmd)}`,
  ], { timeout: 45000 });
  return (r.stdout || '') + (r.status !== 0 ? (r.stderr || '') : '');
}

function gitOut(args) {
  const r = baseSpawn('git', args, { timeout: 60000 });
  return (r.status === 0 ? r.stdout || '' : (r.stdout || '') + (r.stderr || '')).trim();
}

function psOut(script) {
  const r = baseSpawn('powershell', ['-NoProfile', '-Command', script], { timeout: 90000 });
  return ((r.status === 0 ? r.stdout || '' : (r.stdout || '') + (r.stderr || ''))).trim();
}

// ---------- 结果记账 ----------

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail, skip: false });
}
// skip=true 的项计入总数但不算 FAIL —— 仅用于大哥明确要求「本轮不动 PVE」的桌面-only 交付
function recordSkip(name, detail) {
  results.push({ name, pass: true, detail: `${detail} [SKIP]`, skip: true });
}

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

// ---------- 基础信息 ----------

const version = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
  today.getDate()
).padStart(2, '0')}`;

console.log(`一条龙交付终检  ${todayStr}  目标版本 v${version}  [ssh 模式: ${MODE}]`);
console.log('='.repeat(78));

// ---------- 1. 工作区干净 ----------
{
  const st = gitOut(['status', '--short']);
  record('工作区干净', st === '', st === '' ? 'git status 为空' : st.split('\n')[0]);
}

// ---------- 2. 本地 sync == GitHub origin/sync ----------
let localSha = '';
{
  localSha = gitOut(['rev-parse', '--short', 'sync']);
  const remote = gitOut(['ls-remote', 'origin', 'sync']).slice(0, 8);
  const pass = remote.length === 8 && localSha.startsWith(remote.slice(0, 7));
  record('已推自己的 GitHub', pass, `本地=${localSha}  origin/sync=${remote || '(取不到)'}`);
}

// ---------- 3. 不落后上游 ----------
{
  const counts = gitOut(['rev-list', '--left-right', '--count', 'sync...upstream/main']).split(/\s+/);
  const b = Number(counts[1]);
  record('不落后上游', b === 0, `落后上游提交数 B=${Number.isNaN(b) ? '(取不到)' : b}`);
}

// ---------- 4/5. 4 台 PVE：commit + HTTP ----------
// 大哥明确「本轮只更桌面版、PVE 不动」时传 --skip-pve（或 SKIP_PVE=1）：PVE 项标 SKIP 且不判 FAIL。
const SKIP_PVE =
  process.argv.includes('--skip-pve') || process.env.SKIP_PVE === '1';
if (SKIP_PVE) {
  for (const vm of VMS) {
    recordSkip(`PVE ${vm.id} commit`, '本轮按大哥要求跳过 PVE');
    recordSkip(`PVE ${vm.id} 服务存活`, '本轮按大哥要求跳过 PVE');
  }
}
for (const vm of (SKIP_PVE ? [] : VMS)) {
  const out = sshOut(
    vm.id,
    `cd ${vm.dir} && echo "__H__=$(git rev-parse --short=7 HEAD) __C__=$(curl -s -o /dev/null -w '%{http_code}' -m 10 http://127.0.0.1:8648)"`
  );
  const head = (out.match(/__H__=([0-9a-f]{7})\b/) || [])[1] || '(无)';
  const code = (out.match(/__C__=(\d{3})/) || [])[1] || '000';
  record(
    `PVE ${vm.id} commit`,
    head !== '(无)' && localSha.startsWith(head.slice(0, 7)),
    `${head}  (期望 ${localSha})`
  );
  record(`PVE ${vm.id} 服务存活`, code === '200', `HTTP ${code}`);
}

// ---------- 6. d:\desk 安装包 ----------
{
  const out = psOut(
    `(Get-ChildItem 'd:\\desk' -Filter 'Ekko.Studio-*.exe' -ErrorAction SilentlyContinue | ` +
      `Select-Object -ExpandProperty Name) -join ','`
  );
  const names = out ? out.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const wanted = `Ekko.Studio-${version}-x64.exe`;
  const hasWanted = names.includes(wanted);
  const pass = hasWanted && names.length === 1;
  record(
    '桌面安装包',
    pass,
    names.length === 0
      ? 'd:\\desk 无 exe'
      : `${names.join(' | ')}${hasWanted ? '' : `  (期望 ${wanted})`}${
          names.length > 1 ? '  ← 有旧版残留' : ''
        }`
  );
}

// ---------- 7. 本机安装版本 ----------
{
  const out = psOut(
    `$p='C:\\Users\\baba1\\AppData\\Local\\Programs\\Ekko Studio\\Ekko Studio.exe'; ` +
      `if (Test-Path $p) { (Get-Item $p).VersionInfo.ProductVersion } else { 'NOT-INSTALLED' }`
  );
  const firstLine = out.split('\n').map((s) => s.trim()).filter(Boolean)[0] || '(无输出)';
  const pass = firstLine.replace(/\.0$/, '') === version || firstLine === version;
  record('本机桌面版已升级', pass, `ProductVersion=${firstLine}  (期望 ${version}.0)`);
}

// ---------- 8. 桌面服务健康 ----------
{
  const out = psOut(
    `try { (Invoke-WebRequest -Uri 'http://127.0.0.1:26500/health' -Proxy $null -TimeoutSec 10 -UseBasicParsing).Content } ` +
      `catch { 'NO-LISTENER' }`
  );
  const jsonLine = out.split('\n').find((l) => l.trim().startsWith('{')) || out.slice(0, 120);
  let webui = '(未取到)';
  let bridge = '(未取到)';
  let gateway = '(未取到)';
  try {
    const j = JSON.parse(jsonLine);
    webui = String(j.webui_version ?? '(字段缺失)');
    gateway = String(j.gateway ?? '(字段缺失)');
    bridge = `${j.agent_bridge?.status ?? '?'}/ready=${j.agent_bridge?.ready ?? '?'}`;
  } catch {
    /* 非 JSON 时保留占位 */
  }
  const pass = webui === version && /ready=True|ready=true/.test(bridge);
  record('桌面服务健康', pass, `webui=${webui} gateway=${gateway} bridge=${bridge}`);
}

// ---------- 9. 记账没漏 ----------
{
  let contains = false;
  try {
    const text = readFileSync(path.join(ROOT, 'CUSTOM_CHANGES.md'), 'utf8');
    contains = text.includes(todayStr);
  } catch {
    contains = false;
  }
  record('记账已更新', contains, `CUSTOM_CHANGES.md 含今日日期 ${todayStr}: ${contains ? '是' : '否'}`);
}

// ---------- 输出 ----------

console.log('');
const NAME_W = 20;
for (const r of results) {
  const tag = r.skip ? '  SKIP' : r.pass ? '  PASS' : '  FAIL';
  console.log(`${tag}  ${pad(r.name, NAME_W)} ${r.detail}`);
}

const failed = results.filter((r) => !r.pass && !r.skip);
const skipped = results.filter((r) => r.skip);
const passed = results.filter((r) => r.pass && !r.skip);
console.log('');
console.log('='.repeat(78));
if (failed.length === 0) {
  const skipNote = skipped.length ? `（其中 ${skipped.length} 项 SKIP，${passed.length} 项 PASS）` : '';
  console.log(`全部通过 ${results.length}/${results.length} ${skipNote} —— 一条龙完成，可以交付汇报。`);
  process.exit(0);
} else {
  console.log(
    `未通过 ${failed.length}/${results.length} —— 回去补完下面这几步再重跑：`
  );
  for (const r of failed) console.log(`   - ${r.name}: ${r.detail}`);
  console.log('\n对照 SYNC-CHECKLIST.md 补齐后重跑：node scripts/delivery-verify.mjs');
  process.exit(1);
}
