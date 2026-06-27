import { Pool, PoolClient } from 'pg'

let pool: Pool | null = null

/**
 * Initialize the PostgreSQL connection pool
 * This should be called once at application startup
 */
function initializePool(): Pool {
  if (pool) {
    return pool
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: 20, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 5000, // Connection attempt timeout
  })

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err)
  })

  return pool
}

/**
 * Get the connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    return initializePool()
  }
  return pool
}

/**
 * Get a client from the pool for executing queries
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  return await pool.connect()
}

/**
 * Execute a query with automatic client management
 * Use this for simple queries that don't require transactions
 */
export async function query(
  text: string,
  params: unknown[] = []
): Promise<any> {
  const client = await getClient()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

/**
 * Execute a query and return rows
 */
export async function queryRows(
  text: string,
  params: unknown[] = []
): Promise<any[]> {
  const result = await query(text, params)
  return result.rows
}

/**
 * Execute a query and return a single row
 */
export async function queryOne(
  text: string,
  params: unknown[] = []
): Promise<any | null> {
  const result = await query(text, params)
  return result.rows[0] || null
}

/**
 * Begin a transaction
 */
export async function beginTransaction(client: PoolClient): Promise<void> {
  await client.query('BEGIN')
}

/**
 * Commit a transaction
 */
export async function commit(client: PoolClient): Promise<void> {
  await client.query('COMMIT')
}

/**
 * Rollback a transaction
 */
export async function rollback(client: PoolClient): Promise<void> {
  await client.query('ROLLBACK')
}

/**
 * Close the connection pool
 * Call this during application shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
