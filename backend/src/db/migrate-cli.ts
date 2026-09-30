import { migrate, migrateDown } from './migrate.js';
import { closeDb } from './pool.js';

// npm run migrate            alle offenen Migrationen
// npm run migrate:down -- X  Rückweg der Migration X (braucht X.down.sql)
const [cmd, name] = process.argv.slice(2);
(cmd === 'down' && name ? migrateDown(name) : migrate())
  .then(() => closeDb())
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
