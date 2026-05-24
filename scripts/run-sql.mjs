import fs from 'node:fs/promises'
import process from 'node:process'
import { Client } from 'pg'

function loadEnvFile(path = '.env.local') {
  // Minimal .env.local loader (no extra deps).
  // Used so SQL scripts work when env vars aren't exported in the current shell.
  return fs.readFile(path, 'utf8').then((text) => {
    for (const line of text.split(/\r?\n/)) {
      const l = line.trim()
      if (!l || l.startsWith('#')) continue
      const idx = l.indexOf('=')
      if (idx < 0) continue
      const key = l.slice(0, idx).trim()
      let val = l.slice(idx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      // Don't clobber anything already provided by the shell environment.
      if (!(key in process.env)) process.env[key] = val
    }
  })
}

async function main() {
  const relativePath = process.argv[2] || 'scripts/01_init_schema.sql'
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL

  if (!connectionString) {
    // Try to load from local env file for convenience/dev.
    await loadEnvFile('.env.local').catch(() => null)
  }

  const connectionString2 = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
  if (!connectionString2) {
    throw new Error('Missing POSTGRES_URL_NON_POOLING or POSTGRES_URL (set in env or .env.local)')
  }

  // Dev-only: Supabase often uses a cert chain that can fail local TLS validation.
  // Relax verification so SQL scripts can be applied.
  if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  const sql = await fs.readFile(relativePath, 'utf8')
  const client = new Client({
    connectionString: connectionString2,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  try {
    await client.query(sql)
    console.log(`Applied SQL: ${relativePath}`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
