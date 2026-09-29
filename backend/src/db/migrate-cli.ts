import { migrate } from './migrate.js';
import { closeDb } from './pool.js';

migrate()
  .then(() => closeDb())
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
