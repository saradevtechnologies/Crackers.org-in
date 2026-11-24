// Applies every migration to an in-memory Postgres (PGlite) with Supabase stubs, then runs the SQL tests.
// Usage: npm run test:sql
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const root = join(import.meta.dirname, '..', 'supabase');
const db = new PGlite({ extensions: { pgcrypto } });

const run = async (label, file) => {
  try {
    await db.exec(readFileSync(file, 'utf8'));
    console.log(`  applied ${label}`);
  } catch (e) {
    console.error(`\n✗ ${label} failed: ${e.message}`);
    process.exit(1);
  }
};

await run('tests/stubs.sql', join(root, 'tests', 'stubs.sql'));
for (const f of readdirSync(join(root, 'migrations')).filter((f) => f.endsWith('.sql')).sort()) {
  await run(`migrations/${f}`, join(root, 'migrations', f));
}
const tests = readdirSync(join(root, 'tests')).filter((f) => /_test\.sql$/.test(f)).sort();
for (const f of tests) await run(`tests/${f}`, join(root, 'tests', f));

const { rows } = await db.query("select name, coalesce(ok, false) as ok, coalesce(detail, 'null') as detail from test_results order by n");
let failed = 0;
for (const r of rows) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? '' : `  → got: ${r.detail}`}`);
}
console.log(`\n${rows.length - failed}/${rows.length} passed`);
process.exit(failed ? 1 : 0);
