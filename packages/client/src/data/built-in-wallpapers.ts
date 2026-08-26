export interface BuiltInWallpaper {
  id: string
  name: string
  css: string
  preview: string
}

export const BUILT_IN_WALLPAPERS: BuiltInWallpaper[] = [
  {
    id: 'midnight-code',
    name: '午夜代码',
    css: 'linear-gradient(135deg, #0f0c29 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0d1b2a 100%)',
    preview: 'linear-gradient(135deg, #0f0c29 0%, #16213e 50%, #0d1b2a 100%)',
  },
  {
    id: 'nord-aurora',
    name: 'Nord 极光',
    css: 'linear-gradient(160deg, #2E3440 0%, #3B4252 30%, #434C5E 50%, #4C566A 70%, #2E3440 100%)',
    preview: 'linear-gradient(160deg, #2E3440 0%, #434C5E 50%, #2E3440 100%)',
  },
  {
    id: 'matrix-green',
    name: '矩阵绿',
    css: 'radial-gradient(ellipse at 50% 100%, rgba(0,128,0,0.15) 0%, transparent 60%), linear-gradient(180deg, #000000 0%, #0a0f0a 50%, #001200 100%)',
    preview: 'linear-gradient(180deg, #000000 0%, #001200 100%)',
  },
  {
    id: 'dracula',
    name: 'Dracula',
    css: 'linear-gradient(135deg, #282a36 0%, #383a4a 25%, #44475a 50%, #383a4a 75%, #282a36 100%)',
    preview: 'linear-gradient(135deg, #282a36 0%, #44475a 50%, #282a36 100%)',
  },
  {
    id: 'tokyo-night',
    name: '东京之夜',
    css: 'linear-gradient(180deg, #1a1b26 0%, #16161e 30%, #1a1b26 60%, #24283b 100%), radial-gradient(ellipse at 80% 20%, rgba(187,154,247,0.08) 0%, transparent 50%)',
    preview: 'linear-gradient(180deg, #1a1b26 0%, #24283b 100%)',
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    css: 'linear-gradient(135deg, #282C34 0%, #21252B 30%, #1B222C 60%, #282C34 100%)',
    preview: 'linear-gradient(135deg, #282C34 0%, #1B222C 60%, #282C34 100%)',
  },
  {
    id: 'cyber-sunset',
    name: '赛博日落',
    css: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 70%, #0f0c29 100%)',
    preview: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #0f0c29 100%)',
  },
  {
    id: 'deep-ocean',
    name: '深海',
    css: 'linear-gradient(180deg, #0B1026 0%, #0C1B3D 30%, #0A2549 60%, #061A30 100%)',
    preview: 'linear-gradient(180deg, #0B1026 0%, #0A2549 60%, #061A30 100%)',
  },
  {
    id: 'monokai',
    name: 'Monokai',
    css: 'linear-gradient(135deg, #272822 0%, #2D2F28 30%, #1E1F1C 60%, #272822 100%)',
    preview: 'linear-gradient(135deg, #272822 0%, #1E1F1C 60%, #272822 100%)',
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    css: 'linear-gradient(180deg, #0d1117 0%, #161b22 40%, #0d1117 80%, #010409 100%)',
    preview: 'linear-gradient(180deg, #0d1117 0%, #161b22 50%, #010409 100%)',
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    css: 'linear-gradient(135deg, #1e1e2e 0%, #313244 30%, #181825 60%, #1e1e2e 100%)',
    preview: 'linear-gradient(135deg, #1e1e2e 0%, #313244 50%, #1e1e2e 100%)',
  },
  {
    id: 'rose-pine',
    name: 'Rose Pine',
    css: 'linear-gradient(135deg, #191724 0%, #26233a 30%, #1f1d2e 60%, #191724 100%)',
    preview: 'linear-gradient(135deg, #191724 0%, #26233a 50%, #191724 100%)',
  },
  {
    id: 'opencode-green',
    name: '墨绿终端',
    css: 'radial-gradient(ellipse at 50% 0%, rgba(34,139,87,0.08) 0%, transparent 60%), linear-gradient(180deg, #0a1410 0%, #0d1b14 30%, #0e1f16 50%, #0b1610 70%, #080f0c 100%)',
    preview: 'linear-gradient(180deg, #0a1410 0%, #0e1f16 50%, #080f0c 100%)',
  },
  {
    id: 'forest-deep',
    name: '深林',
    css: 'linear-gradient(135deg, #0d1f17 0%, #122820 25%, #1a3328 50%, #0d1f17 75%, #0a1610 100%)',
    preview: 'linear-gradient(135deg, #0d1f17 0%, #1a3328 50%, #0a1610 100%)',
  },
]
