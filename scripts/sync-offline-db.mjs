/**
 * @fileoverview Database Synchronization Utility for Heart Check PHC.
 *
 * Pulls the latest cloud schema and data from the Supabase Cloud project
 * and restores them cleanly into the local Docker Supabase PostgreSQL container.
 * Drops existing tables in local public schema prior to loading to ensure
 * deleted rows in the cloud are completely wiped locally as well.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const CLOUD_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'ewpvlsbbmkxuahhaezvo';
const LOCAL_DB_PORT = 54322;
const LOCAL_DB_URL = `postgresql://postgres:postgres@127.0.0.1:${LOCAL_DB_PORT}/postgres`;
const DOCKER_CONTAINER_NAME = 'supabase_db_heart-check-phc';

const SCHEMA_FILE = path.resolve(process.cwd(), 'supabase', 'snapshot_schema.sql');
const DATA_FILE = path.resolve(process.cwd(), 'supabase', 'snapshot_data.sql');

/**
 * Checks whether a given TCP port is actively accepting connections.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

/**
 * Executes a shell command synchronously and exits if it fails.
 * @param {string} command
 * @param {string[]} args
 * @param {object} [options]
 */
function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    ...options,
  });

  if (result.error) {
    process.stderr.write(`[ERROR] Command failed to execute: ${command} ${args.join(' ')}\n`);
    process.stderr.write(`Details: ${result.error.message}\n`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.stderr.write(`[ERROR] Command exited with code ${result.status}: ${command} ${args.join(' ')}\n`);
    process.exit(result.status ?? 1);
  }
}

/**
 * Executes SQL commands against the local PostgreSQL container.
 * Prefers host psql if installed; falls back to docker exec.
 * @param {string} sql
 */
function executeLocalSql(sql) {
  const hasPsql = spawnSync('which', ['psql']).status === 0;

  if (hasPsql) {
    const res = spawnSync('psql', [LOCAL_DB_URL, '-c', sql], { stdio: 'inherit' });
    if (res.status !== 0) {
      process.stderr.write(`[ERROR] Failed to execute SQL query via psql.\n`);
      process.exit(1);
    }
    return;
  }

  const res = spawnSync('docker', ['exec', '-i', DOCKER_CONTAINER_NAME, 'psql', '-U', 'postgres', '-d', 'postgres', '-c', sql], { stdio: 'inherit' });
  if (res.status !== 0) {
    process.stderr.write(`[ERROR] Failed to execute SQL query via docker exec.\n`);
    process.exit(1);
  }
}

/**
 * Restores an SQL file into the local PostgreSQL container.
 * @param {string} filePath
 */
function restoreSqlFile(filePath) {
  const hasPsql = spawnSync('which', ['psql']).status === 0;

  if (hasPsql) {
    runCommand('psql', [LOCAL_DB_URL, '-f', filePath]);
    return;
  }

  const fileContent = fs.readFileSync(filePath);
  const res = spawnSync('docker', ['exec', '-i', DOCKER_CONTAINER_NAME, 'psql', '-U', 'postgres', '-d', 'postgres'], {
    input: fileContent,
    stdio: ['pipe', 'inherit', 'inherit'],
  });

  if (res.status !== 0) {
    process.stderr.write(`[ERROR] Failed to restore ${filePath} via docker exec.\n`);
    process.exit(1);
  }
}

async function main() {
  process.stdout.write('==============================================================================\n');
  process.stdout.write(' Heart Check PHC - Offline Database Synchronization Utility\n');
  process.stdout.write('==============================================================================\n\n');

  // Step 1: Verify local Supabase container is active
  process.stdout.write('[1/5] Checking local Supabase PostgreSQL container on port ' + LOCAL_DB_PORT + '...\n');
  const isDbUp = await isPortListening(LOCAL_DB_PORT);
  if (!isDbUp) {
    process.stderr.write('[ERROR] Local Supabase database is not running on port ' + LOCAL_DB_PORT + '.\n');
    process.stderr.write('Please start the local stack first: npx supabase start\n');
    process.exit(1);
  }
  process.stdout.write('       Local PostgreSQL container is online and listening.\n\n');

  // Step 2: Dump Cloud Database Schema
  process.stdout.write('[2/5] Exporting latest schema from Cloud Project (' + CLOUD_PROJECT_REF + ')...\n');
  runCommand('npx', ['supabase', 'db', 'dump', '--project-ref', CLOUD_PROJECT_REF, '-f', SCHEMA_FILE]);
  process.stdout.write('       Schema written to: ' + SCHEMA_FILE + '\n\n');

  // Step 3: Dump Cloud Database Data
  process.stdout.write('[3/5] Exporting latest clinical records, accounts, and config data from Cloud...\n');
  runCommand('npx', ['supabase', 'db', 'dump', '--project-ref', CLOUD_PROJECT_REF, '--data-only', '-f', DATA_FILE]);
  process.stdout.write('       Data written to: ' + DATA_FILE + '\n\n');

  // Step 4: Drop existing local public schema to cleanly wipe stale and deleted records
  process.stdout.write('[4/5] Resetting local public schema to eliminate stale and deleted records...\n');
  const wipeSql = [
    'DROP SCHEMA IF EXISTS public CASCADE;',
    'CREATE SCHEMA public;',
    'GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;',
    'GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;',
    'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;',
    'GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;'
  ].join(' ');
  executeLocalSql(wipeSql);
  process.stdout.write('       Local public schema reset successfully.\n\n');

  // Step 5: Restore Schema, Data, and Realtime Publications
  process.stdout.write('[5/5] Restoring schema, records, and Realtime publications to local database...\n');
  restoreSqlFile(SCHEMA_FILE);
  restoreSqlFile(DATA_FILE);

  const publicationSql = [
    'DO $$',
    'BEGIN',
    '  ALTER PUBLICATION supabase_realtime ADD TABLE patients, cubicle, counters, doctors;',
    'EXCEPTION WHEN duplicate_object THEN',
    '  NULL;',
    'END $$;'
  ].join('\n');
  executeLocalSql(publicationSql);

  process.stdout.write('\n==============================================================================\n');
  process.stdout.write(' Database synchronization complete. Local Docker database is now 100% in sync\n');
  process.stdout.write(' with Supabase Cloud. Deleted rows and updated schemas have been fully mirrored.\n');
  process.stdout.write('==============================================================================\n');
}

main().catch((err) => {
  process.stderr.write(`[FATAL] Database sync encountered an error: ${err.message}\n`);
  process.exit(1);
});

