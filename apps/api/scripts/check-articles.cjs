const path = require('node:path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

async function inspect(label, connectionString) {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const result = await client.query(
      'SELECT slug, status, "publishedAt", "deletedAt" FROM "Article" ORDER BY "createdAt" DESC LIMIT 20'
    );
    console.log(`\n[${label}] count=${result.rows.length}`);
    console.log(JSON.stringify(result.rows, null, 2));
    await client.end();
  } catch (error) {
    console.log(`\n[${label}] error: ${error.message}`);
  }
}

async function main() {
  await inspect('env DATABASE_URL', process.env.DATABASE_URL);
  await inspect(
    'local postgres 5432',
    'postgresql://oman_sale:aliomansale@127.0.0.1:5432/oman_sale?schema=public'
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
