/**
 * CLI script to reset runtime state to canonical seed
 * Executed via 'npm run reset'
 */

import { Database } from '../server/db.js';

const db = new Database();
db.reset();
console.log('Database successfully reset to canonical seed data (data/db.json).');

