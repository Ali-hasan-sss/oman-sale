const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

async function main() {
  const { articlesService } = await import('../src/modules/articles/articles.service.ts');
  const result = await articlesService.list({ page: 1, limit: 20 });
  console.log(JSON.stringify({ total: result.total, slugs: result.items.map((item) => item.slug) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
