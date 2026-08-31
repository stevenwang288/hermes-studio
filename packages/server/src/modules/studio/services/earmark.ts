/**
 * earmark — annotation broker for Hermes Studio.
 *
 * Starts the earmark-server HTTP/SSE broker alongside the Hermes server,
 * so the browser overlay can push annotations to a local store and the
 * Hermes agent can read them via the MCP server.
 *
 * The broker binds to 127.0.0.1:7331 (loopback only) and uses SQLite
 * storage at HERMES_WEB_UI_HOME/earmark/annotations.db.
 * It is only started when earmark-server is installed as a dependency.
 */

import { startEarmarkServer, DEFAULT_PORT, DEFAULT_HOST } from 'earmark-server'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { logger } from '../public/logging'

const EARMARK_STATE_DIR = process.env.HERMES_WEB_UI_HOME
  || process.env.HERMES_WEBUI_STATE_DIR
  || join(process.cwd(), '.hermes-web-ui')

let earmarkServer: Awaited<ReturnType<typeof startEarmarkServer>> | null = null

export async function startEarmark(): Promise<void> {
  if (earmarkServer) return

  const dataDir = join(EARMARK_STATE_DIR, 'earmark')
  await mkdir(dataDir, { recursive: true })

  try {
    earmarkServer = await startEarmarkServer({
      host: DEFAULT_HOST,       // 127.0.0.1 (loopback only)
      port: DEFAULT_PORT,       // 7331
      file: join(dataDir, 'annotations.db'),
      store: 'sqlite',
      quiet: false,
    })
    logger.info(`earmark broker started on http://${DEFAULT_HOST}:${DEFAULT_PORT}`)
  } catch (error) {
    logger.warn({ error }, 'Failed to start earmark broker — earmark annotations will not be available')
  }
}

export async function stopEarmark(): Promise<void> {
  if (!earmarkServer) return
  try {
    await earmarkServer.close()
    logger.info('earmark broker stopped')
  } catch (error) {
    logger.warn({ error }, 'Error stopping earmark broker')
  }
  earmarkServer = null
}

export function getEarmarkHealth(): { running: boolean; port: number } {
  return {
    running: earmarkServer !== null,
    port: DEFAULT_PORT,
  }
}