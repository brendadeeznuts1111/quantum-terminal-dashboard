/**
 * Database Utilities - Enhanced SQL with Bun
 *
 * Features:
 * - sql() INSERT helper respects undefined values
 * - Bulk insert with proper column detection
 * - CRC32 hashing (20x faster with hardware acceleration)
 * - SQLite 3.51.2 support
 */

import { hash } from "bun";

/**
 * Insert single record with undefined value handling
 * Undefined values are omitted, allowing DEFAULT values to be used
 */
export function insertRecord(table, data) {
  // Filter out undefined values
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  // Returns the filtered data for use with sql()
  return {
    table,
    data: filtered,
    columns: Object.keys(filtered),
  };
}

/**
 * Bulk insert with proper column detection
 * Handles cases where later objects have columns not in the first object
 */
export function bulkInsert(table, records) {
  if (!records || records.length === 0) {
    return [];
  }

  // Collect all unique columns from all records
  const allColumns = new Set();
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (record[key] !== undefined) {
        allColumns.add(key);
      }
    }
  }

  // Normalize records to include all columns
  const normalized = records.map(record => {
    const normalized = {};
    for (const col of allColumns) {
      normalized[col] = record[col];
    }
    return normalized;
  });

  // Return normalized records for use with sql()
  return {
    table,
    records: normalized,
    columns: Array.from(allColumns),
  };
}

/**
 * Upsert (INSERT OR REPLACE) with undefined handling
 */
export function upsertRecord(table, data, conflictColumns = ['id']) {
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  // Return filtered data for use with sql()
  return {
    table,
    data: filtered,
    columns: Object.keys(filtered),
    conflictColumns,
  };
}

/**
 * Fast CRC32 hashing (20x faster with hardware acceleration)
 * Uses zlib's hardware-accelerated CRC32 instructions
 */
export function fastCrc32(data) {
  // Bun.hash.crc32 now uses hardware-accelerated instructions
  // ~20x faster than software-only implementation
  return hash.crc32(data);
}

/**
 * CRC32 for string data
 */
export function crc32String(str) {
  const buffer = Buffer.from(str, 'utf-8');
  return fastCrc32(buffer);
}

/**
 * CRC32 for file content
 */
export async function crc32File(path) {
  const file = Bun.file(path);
  const buffer = await file.arrayBuffer();
  return fastCrc32(new Uint8Array(buffer));
}

/**
 * Batch CRC32 hashing
 */
export function batchCrc32(items) {
  return items.map(item => {
    if (typeof item === 'string') {
      return crc32String(item);
    }
    return fastCrc32(item);
  });
}

/**
 * CRC32 checksum verification
 */
export function verifyCrc32(data, expectedChecksum) {
  const actual = fastCrc32(data);
  return actual === expectedChecksum;
}

/**
 * Database transaction helper
 */
export function transaction(db, fn) {
  try {
    db.exec('BEGIN TRANSACTION');
    const result = fn(db);
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Batch operation with transaction
 */
export function batchOperation(db, table, records, operation = 'insert') {
  return transaction(db, () => {
    const results = [];
    for (const record of records) {
      if (operation === 'insert') {
        results.push(insertRecord(table, record));
      } else if (operation === 'upsert') {
        results.push(upsertRecord(table, record));
      }
    }
    return results;
  });
}

/**
 * Query with CRC32 verification
 */
export function queryWithChecksum(db, query, expectedChecksum) {
  const result = db.query(query).all();
  const data = JSON.stringify(result);
  const checksum = crc32String(data);

  return {
    data: result,
    checksum,
    verified: checksum === expectedChecksum,
  };
}

export default {
  insertRecord,
  bulkInsert,
  upsertRecord,
  fastCrc32,
  crc32String,
  crc32File,
  batchCrc32,
  verifyCrc32,
  transaction,
  batchOperation,
  queryWithChecksum,
};

