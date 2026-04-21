import fs from 'node:fs/promises'
import process from 'node:process'
import { Client } from 'pg'

async function main() {
  const relativePath = process.argv[2] || 'scripts/01_init_schema.sql'
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL

  if (!connectionString) {
    throw new Error('Missing POSTGRES_URL_NON_POOLING or POSTGRES_URL')
  }

  const sql = await fs.readFile(relativePath, 'utf8')
  const client = new Client({
    connectionString,
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
