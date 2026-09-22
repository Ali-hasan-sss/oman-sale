const path = require('node:path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

const EMAIL = 'emonate8@gmail.com';
const PASSWORD = '00000000';
const FULL_NAME = 'App Store Reviewer';
const PREFERRED_PHONE = '+96890000008';

async function uniquePhone(client, preferred, ownerEmail) {
  const existing = await client.query('SELECT email FROM "User" WHERE phone = $1 LIMIT 1', [preferred]);
  if (!existing.rowCount || existing.rows[0].email === ownerEmail) return preferred;
  return `+9689${String(Date.now()).slice(-7)}`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing');
  }

  const passwordHash = await bcrypt.hash(PASSWORD, Number(process.env.PASSWORD_SALT_ROUNDS || 12));
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const phone = await uniquePhone(client, PREFERRED_PHONE, EMAIL);
    const result = await client.query(
      `INSERT INTO "User" (
          id, "fullName", email, phone, password, role,
          "isVerified", "isActive", "isBlocked", "profileCompleted",
          "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 'USER',
          true, true, false, true,
          NOW(), NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          password = EXCLUDED.password,
          "isVerified" = true,
          "isActive" = true,
          "isBlocked" = false,
          "deletedAt" = NULL,
          "profileCompleted" = true,
          phone = COALESCE("User".phone, EXCLUDED.phone),
          "updatedAt" = NOW()
        RETURNING id, email, "isVerified", "isActive", "isBlocked", "profileCompleted", phone`,
      [FULL_NAME, EMAIL, phone, passwordHash]
    );

    const user = result.rows[0];
    console.log('App Store review account ready:');
    console.log(`  email: ${EMAIL}`);
    console.log(`  password: ${PASSWORD}`);
    console.log(`  id: ${user.id}`);
    console.log(`  phone: ${user.phone}`);
    console.log(`  verified: ${user.isVerified}`);
    console.log(`  active: ${user.isActive}`);
    console.log(`  blocked: ${user.isBlocked}`);
    console.log(`  profileCompleted: ${user.profileCompleted}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
