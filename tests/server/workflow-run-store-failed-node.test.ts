import { expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

it('persists and reads back the failed node id and error summary on a run record', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'studio-workflow-failed-node-'))
  const script = `
    const assert = require('node:assert/strict');
    const base = process.cwd() + '/packages/server/src/modules/studio/';
    require(base + 'infrastructure/database/schemas').initAllHermesTables();
    assert.ok(require(base + 'infrastructure/database').getDb(), 'Use real SQLite');
    const store = require(base + 'repositories/workflow-run-store');

    store.createWorkflowRun({ id: 'clean', workflow_id: 'wf', status: 'failed', error: 'boom' });
    assert.equal(store.getWorkflowRun('clean').failed_node_id, null);
    assert.equal(store.getWorkflowRun('clean').failed_node_error, null);

    store.createWorkflowRun({
      id: 'failed', workflow_id: 'wf', status: 'failed', error: 'Node agent-a failed: timeout',
      failed_node_id: 'agent-a', failed_node_error: 'timeout',
    });
    const created = store.getWorkflowRun('failed');
    assert.equal(created.failed_node_id, 'agent-a');
    assert.equal(created.failed_node_error, 'timeout');

    store.updateWorkflowRun('failed', { failed_node_id: 'agent-b', failed_node_error: 'internal error' });
    const updated = store.getWorkflowRun('failed');
    assert.equal(updated.failed_node_id, 'agent-b');
    assert.equal(updated.failed_node_error, 'internal error');
    assert.equal(updated.status, 'failed');
    assert.equal(updated.error, 'Node agent-a failed: timeout');

    const evidence = store.getWorkflowRunWithEvidence('failed');
    assert.equal(evidence.failed_node_id, 'agent-b');
    assert.equal(evidence.failed_node_error, 'internal error');

    console.log('Persisted failed node id and error summary verified');
  `
  const run = () => promisify(execFile)(process.execPath, ['-r', 'ts-node/register', '-e', script], {
    cwd: resolve('.'), timeout: 15_000,
    env: { ...process.env, NODE_ENV: 'test', HERMES_WEB_UI_TEST_DB_DIR: join(directory, 'db'),
      HERMES_WEB_UI_HOME: join(directory, 'web'), HERMES_HOME: join(directory, 'hermes'),
      TS_NODE_PROJECT: 'packages/server/tsconfig.json', TS_NODE_FILES: 'true', TS_NODE_TRANSPILE_ONLY: 'true', TS_NODE_COMPILER_OPTIONS: '{"rootDir":"."}' },
  })
  try {
    const { stdout } = await run()
    expect(stdout).toContain('Persisted failed node id and error summary verified')
  } finally { await rm(directory, { recursive: true, force: true }) }
}, 30_000)
