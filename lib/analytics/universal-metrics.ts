import { calculateQualityScore } from './quality-score';

export interface UniversalMetrics {
  rowCount: number;
  colCount: number;
  qualityScore: number;
  missingValueRate: number;
  duplicateRate: number;
  fileSizeFormatted: string;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // Round to 1 decimal place
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function calculateUniversalMetrics(
  dataset: any,
  rows: Record<string, unknown>[]
): UniversalMetrics {
  const rowCount = rows.length;
  const headers: string[] = dataset.headers || [];
  const colCount = headers.length;
  const totalCells = rowCount * colCount;

  // Compute Quality Score using shared utility
  const quality = calculateQualityScore(rows, headers);

  // Compute missing value rate
  let emptyCells = 0;
  for (const row of rows) {
    for (const header of headers) {
      const val = row[header];
      if (
        val === null ||
        val === undefined ||
        String(val).trim() === '' ||
        String(val).trim().toUpperCase() === 'N/A'
      ) {
        emptyCells++;
      }
    }
  }
  const missingValueRate = totalCells > 0 ? (emptyCells / totalCells) * 100 : 0;

  // Compute duplicate rate
  const uniqueRows = new Set(rows.map((r) => JSON.stringify(r)));
  const duplicateRows = rowCount - uniqueRows.size;
  const duplicateRate = rowCount > 0 ? (duplicateRows / rowCount) * 100 : 0;

  // Dynamic file size estimation (approximate JSON size of rows + headers)
  // This avoids the need for modifying the database schema for fileSize
  const estimatedBytes = JSON.stringify(rows).length + JSON.stringify(headers).length;
  const fileSizeFormatted = formatBytes(estimatedBytes);

  return {
    rowCount,
    colCount,
    qualityScore: quality.score,
    missingValueRate,
    duplicateRate,
    fileSizeFormatted,
  };
}
