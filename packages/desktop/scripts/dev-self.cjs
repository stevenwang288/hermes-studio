#!/usr/bin/env node
// 自用版启动器
delete process.env.ELECTRON_RUN_AS_NODE
delete process.env.ELECTRON_FORCE_RENDERER_ACCESSIBILITY
delete process.env.NODE_OPTIONS

const { spawn } = require('child_process')
const electron = require('electron')
const { env } = process

// 端口隔离：自用版用不同端口
env.HERMES_DESKTOP_PORT = '8749'
// 复用桌面版已装 runtime（指向完整的 runtime 根目录，含 python/node/git 子目录）
env.HERMES_DESKTOP_RUNTIME_DIR = 'C:\\Users\\baba1\\.hermes-web-ui\\desktop-runtime\\hermes\\0.20.0\\win-x64'

// cwd 必须指向 packages/desktop 根目录（package.json main = dist/main/index.js）
const desktopRoot = require('path').resolve(__dirname, '..')

const child = spawn(electron, ['.'], {
  stdio: 'inherit',
  env,
  cwd: desktopRoot,
})

child.on('close', code => process.exit(code ?? 0))
