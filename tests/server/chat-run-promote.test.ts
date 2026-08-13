import { beforeEach, describe, expect, it, vi } from 'vitest'

const bridgeMock = vi.hoisted(() => ({
  status: vi.fn(),
  statusIfLoaded: vi.fn(),
  releaseBackgroundNotification: vi.fn(async () => ({ ok: true, released: true })),
  close: vi.fn(async () => {}),
  approvalRespond: vi.fn(async () => ({ resolved: true })),
  clarifyRespond: vi.fn(async () => ({ resolved: true })),
}))

vi.mock('../../packages/server/src/services/hermes/run-chat/handle-bridge-run', () => ({
  handleBridgeRun: vi.fn(async () => {}),
  resumeBridgeRun: vi.fn(async () => {}),
}))

vi.mock('../../packages/server/src/services/hermes/run-chat/load-state', () => ({
  loadSessionStateFromDb: vi.fn(),
  resolveRunSource: vi.fn((source?: string) => source || 'cli'),
}))

vi.mock('../../packages/server/src/services/hermes/run-chat/handle-coding-agent-run', () => ({
  handleCodingAgentRun: vi.fn(async () => {}),
}))

vi.mock('../../packages/server/src/services/hermes/run-chat/session-command', () => ({
  handleSessionCommand: vi.fn(),
  isSessionCommand: vi.fn(() => false),
  parseSessionCommand: vi.fn(() => null),
}))

vi.mock('../../packages/server/src/services/hermes/agent-bridge', () => ({
  AgentBridgeClient: vi.fn(() => bridgeMock),
}))

vi.mock('../../packages/server/src/services/hermes/agent-bridge/manager', () => ({
  getAgentBridgeManager: vi.fn(() => ({
    ensureReady: vi.fn(async () => ({ ok: true })),
    getRuntimeState: vi.fn(),
  })),
}))

vi.mock('../../packages/server/src/services/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('../../packages/server/src/lib/llm-prompt', () => ({
  getSystemPrompt: vi.fn(() => 'system prompt'),
}))

vi.mock('../../packages/server/src/db/hermes/session-store', () => ({
  getSession: vi.fn(() => ({ id: 'session-1', profile: 'default', source: 'cli' })),
  getSessionMetadata: vi.fn(() => ({})),
  getSessionDetail: vi.fn(() => null),
}))

vi.mock('../../packages/server/src/services/hermes/hermes-profile', () => ({
  getActiveProfileName: vi.fn(() => 'default'),
  getProfileDir: vi.fn(() => '/tmp/hermes-default'),
  listProfileNamesFromDisk: vi.fn(() => ['default']),
}))

vi.mock('../../packages/server/src/middleware/user-auth', () => ({
  authenticateUserToken: vi.fn(async () => {}),
  isAuthEnabled: vi.fn(async () => false),
}))

vi.mock('../../packages/server/src/db/hermes/users-store', () => ({
  userCanAccessProfile: vi.fn(() => true),
}))

vi.mock('../../packages/server/src/services/hermes/run-chat/usage', () => ({
  calcAndUpdateUsage: vi.fn(async () => {}),
}))

vi.mock('../../packages/server/src/services/hermes/run-chat/response-stream', () => ({
  flushResponseRunToDb: vi.fn(async () => {}),
}))

vi.mock('../../packages/server/src/services/hermes/run-chat/bridge-message', () => ({
  flushBridgePendingToDb: vi.fn(async () => {}),
}))

vi.mock('../../packages/server/src/db/hermes/session-store-stats', () => ({
  updateSessionStats: vi.fn(async () => {}),
}))

vi.mock('../../packages/server/src/db/hermes/session-store-update', () => ({
  updateSession: vi.fn(async () => {}),
}))

function makeServerHarness() {
  const handlers = new Map<string, Function>()
  const emitted: Array<{ room: string; event: string; payload: any }> = []
  const namespace = {
    adapter: { rooms: new Map() },
    to: vi.fn((room: string) => ({
      emit: vi.fn((event: string, payload: any) => emitted.push({ room, event, payload })),
    })),
    use: vi.fn(),
    on: vi.fn(),
  }
  const io = { of: vi.fn(() => namespace) }
  const socket = {
    id: 'socket-1',
    connected: true,
    handshake: { auth: {}, query: { profile: 'default' } },
    data: {},
    emit: vi.fn(),
    join: vi.fn(),
    to: vi.fn(() => ({ emit: vi.fn() })),
    on: vi.fn((event: string, handler: Function) => {
      handlers.set(event, handler)
    }),
  }
  return { emitted, handlers, io, namespace, socket }
}

const QUEUED = [
  { queue_id: 'queue-a', input: 'message A', source: 'cli', profile: 'default' },
  { queue_id: 'queue-b', input: 'message B', source: 'cli', profile: 'default' },
  { queue_id: 'queue-c', input: 'message C', source: 'cli', profile: 'default' },
]

describe('ChatRunSocket run.promote (立即发送)', () => {
  let harness: ReturnType<typeof makeServerHarness>
  let server: any

  beforeEach(async () => {
    vi.resetModules()
    const { ChatRunSocket } = await import('../../packages/server/src/services/hermes/run-chat')
    harness = makeServerHarness()
    server = new ChatRunSocket(harness.io as any)
    // 注册 socket 事件 handlers(生产代码在 onConnection 里 socket.on(...))
    ;(server as any).onConnection(harness.socket)
  })

  it('把目标消息提到队首并立即出队执行(promote 即"立即发送")', async () => {
    const { handlers, emitted, socket } = harness
    ;(server as any).sessionMap.set('session-1', {
      messages: [],
      events: [],
      queue: [...QUEUED],
      isWorking: true,
      isAborting: false,
      profile: 'default',
      source: 'cli',
    })
    // 测试环境没有真实 bridge run,handleAbort 走"no active run"忽略分支,
    // promote 后 fallback dequeueNextQueuedRun 会把提到队首的 queue-c 立即出队执行。
    const handler = handlers.get('run.promote')
    await handler({ session_id: 'session-1', queue_id: 'queue-c' })
    const state = (server as any).sessionMap.get('session-1')
    // queue-c 被立即出队执行,剩下 a、b 按序排队
    expect(state.queue.map((item: any) => item.queue_id)).toEqual(['queue-a', 'queue-b'])
    // 出队事件带 dequeued_queue_id=queue-c,前端据此把 queue-c 从队列面板移除
    const queuedEvt = emitted.find((e: any) => e.event === 'run.queued' && e.payload.dequeued_queue_id === 'queue-c')
    expect(queuedEvt).toBeDefined()
    expect(queuedEvt!.payload.queue_length).toBe(2)
    expect(socket.emit).not.toHaveBeenCalledWith('run.failed', expect.anything())
  })

  it('promote miss 时回传权威队列,前端乐观移除可恢复', async () => {
    const { handlers, emitted } = harness
    ;(server as any).sessionMap.set('session-1', {
      messages: [],
      events: [],
      queue: [...QUEUED],
      isWorking: true,
      isAborting: false,
      profile: 'default',
      source: 'cli',
    })
    const handler = handlers.get('run.promote')
    await handler({ session_id: 'session-1', queue_id: 'queue-does-not-exist' })
    // 必须 emit run.queued 权威队列(带全部剩余消息),前端 replace 后恢复显示
    const queuedEvt = emitted.find((e: any) => e.event === 'run.queued')
    expect(queuedEvt).toBeDefined()
    expect(queuedEvt!.room).toBe('session:session-1')
    expect(queuedEvt!.payload.queue_length).toBe(3)
    expect(Array.isArray(queuedEvt!.payload.queued_messages)).toBe(true)
    // 队列未被改动
    const state = (server as any).sessionMap.get('session-1')
    expect(state.queue.map((item: any) => item.queue_id)).toEqual(['queue-a', 'queue-b', 'queue-c'])
  })

  it('入队时 event 含 queued_messages 权威快照', async () => {
    const { handlers, emitted } = harness
    ;(server as any).sessionMap.set('session-1', {
      messages: [],
      events: [],
      queue: [...QUEUED],
      isWorking: true,
      isAborting: false,
      profile: 'default',
      source: 'cli',
    })
    // 模拟普通发送 preempt=false 排队路径(socket 事件名是 'run')
    const handler = handlers.get('run')
    await handler({
      session_id: 'session-1',
      input: 'message D',
      profile: 'default',
      preempt: false,
      source: 'cli',
    })
    const queuedEvt = emitted.find((e: any) => e.event === 'run.queued' && e.payload.queue_length === 4)
    expect(queuedEvt).toBeDefined()
    expect(Array.isArray(queuedEvt!.payload.queued_messages)).toBe(true)
    expect(queuedEvt!.payload.queued_messages.map((m: any) => m.id)).toEqual([
      'queue-a', 'queue-b', 'queue-c', expect.any(String),
    ])
  })
})