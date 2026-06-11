/**
 * Fallback for `prisma migrate deploy` when the Prisma CLI is blocked (e.g. antivirus).
 * Applies pending SQL migrations and records them in _prisma_migrations.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

const migrationsDir = path.resolve(__dirname, '../prisma/migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);
}

function listMigrationDirs() {
  return fs
    .readdirSync(migrationsDir)
    .filter((entry) => {
      const fullPath = path.join(migrationsDir, entry);
      return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'migration.sql'));
    })
    .sort();
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await ensureMigrationsTable(client);
    const { rows } = await client.query('SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL');
    const applied = new Set(rows.map((row) => row.migration_name));

    const pending = listMigrationDirs().filter((name) => !applied.has(name));
    if (pending.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    for (const migrationName of pending) {
      const sqlPath = path.join(migrationsDir, migrationName, 'migration.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const id = crypto.randomUUID();

      console.log(`Applying ${migrationName}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
           VALUES ($1, $2, NOW(), $3, NULL, NULL, NOW(), 1)`,
          [id, checksum, migrationName]
        );
        await client.query('COMMIT');
        console.log(`Applied ${migrationName}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log(`Done. Applied ${pending.length} migration(s).`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
