import type { Context } from 'koa'
import { expect, it, vi } from 'vitest'
import { filterWorkflowsByName } from '../../packages/server/src/modules/studio/services/workflow/search'

const mocks = vi.hoisted(() => ({
  workflows: [] as Array<{ id: string; name: string; profile: string }>,
}))

vi.mock('../../packages/server/src/modules/studio/services/workflow/manager', () => ({
  getWorkflowManager: () => ({ list: () => mocks.workflows }),
}))
vi.mock('../../packages/server/src/modules/studio/services/notifications/push-registration', () => ({}))
vi.mock('../../packages/server/src/modules/studio/public/workflows', () => ({}))
vi.mock('../../packages/server/src/modules/studio/public/users', () => ({ listUserProfiles: () => [] }))
vi.mock('../../packages/server/src/modules/studio/public/logging', () => ({ logger: { error: () => {} } }))
vi.mock('../../packages/server/src/modules/studio/public/workflow-runtime', () => ({}))
vi.mock('../../packages/server/src/modules/studio/services/workflow/portability', () => ({}))
vi.mock('../../packages/server/src/modules/studio/services/workflow/import-capabilities', () => ({}))
vi.mock('../../packages/server/src/modules/studio/services/workflow/schedule', () => ({}))

import { list } from '../../packages/server/src/modules/studio/controllers/workflows'

const workflows = [
  { id: '1', name: 'Daily Digest' },
  { id: '2', name: 'weekly-review' },
  { id: '3', name: 'Daily Standup' },
]

function listContext(query: Record<string, unknown>): Context {
  return { query, state: { user: { id: 1, role: 'super_admin' } } } as unknown as Context
}

it('returns every workflow when q is omitted', () => {
  expect(filterWorkflowsByName(workflows)).toEqual(workflows)
})

it('returns every workflow when q is blank', () => {
  expect(filterWorkflowsByName(workflows, '   ')).toEqual(workflows)
})

it('matches workflow names case-insensitively', () => {
  expect(filterWorkflowsByName(workflows, 'DAILY').map(workflow => workflow.id)).toEqual(['1', '3'])
  expect(filterWorkflowsByName(workflows, 'WeEkLy').map(workflow => workflow.id)).toEqual(['2'])
})

it('matches partial names anywhere in the name', () => {
  expect(filterWorkflowsByName(workflows, 'digest').map(workflow => workflow.id)).toEqual(['1'])
  expect(filterWorkflowsByName(workflows, 'stand').map(workflow => workflow.id)).toEqual(['3'])
})

it('returns an empty list when nothing matches', () => {
  expect(filterWorkflowsByName(workflows, 'missing')).toEqual([])
})

it('keeps the list response unchanged without q and narrows it with q', async () => {
  mocks.workflows = workflows.map(workflow => ({ ...workflow, profile: 'default' }))
  const ids = (ctx: Context) => (ctx.body as { workflows: Array<{ id: string }> }).workflows.map(workflow => workflow.id)

  const all = listContext({})
  await list(all)
  expect(ids(all)).toEqual(['1', '2', '3'])

  const searched = listContext({ q: 'daIly' })
  await list(searched)
  expect(ids(searched)).toEqual(['1', '3'])

  const repeated = listContext({ q: ['Stand', 'ignored'] })
  await list(repeated)
  expect(ids(repeated)).toEqual(['3'])
})
