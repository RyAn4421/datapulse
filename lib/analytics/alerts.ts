import { calculateQualityScore } from './quality-score';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  type: 'missing_values' | 'duplicate_records' | 'outlier' | 'category_dominance' | 'data_quality';
}

export function generateSmartAlerts(rows: Record<string, unknown>[], headers: string[]): Alert[] {
  const alerts: Alert[] = [];
  if (!rows || rows.length === 0 || !headers || headers.length === 0) return alerts;

  const totalRows = rows.length;
  const totalCells = totalRows * headers.length;

  // 1. Missing Values Alert
  let emptyCells = 0;
  for (const row of rows) {
    for (const header of headers) {
      const val = row[header];
      if (val === null || val === undefined || String(val).trim() === '') {
        emptyCells++;
      }
    }
  }
  const missingRatio = emptyCells / totalCells;
  if (missingRatio > 0.1) {
    alerts.push({
      id: 'alert-missing',
      type: 'missing_values',
      title: 'Missing Values Detected',
      description: `${(missingRatio * 100).toFixed(1)}% of cells are empty. This may skew analysis.`,
      severity: missingRatio > 0.25 ? 'critical' : 'warning',
    });
  }

  // 2. Duplicate Records Alert
  const uniqueRows = new Set(rows.map((r) => JSON.stringify(r)));
  const duplicateCount = totalRows - uniqueRows.size;
  const duplicateRatio = duplicateCount / totalRows;
  
  if (duplicateRatio > 0.05) {
    alerts.push({
      id: 'alert-duplicates',
      type: 'duplicate_records',
      title: 'Duplicate Records Found',
      description: `${duplicateCount} identical rows found (${(duplicateRatio * 100).toFixed(1)}%). Consider deduplicating.`,
      severity: duplicateRatio > 0.15 ? 'critical' : 'warning',
    });
  }

  // 3. Budget Outlier Alert (Numeric Outliers using IQR)
  // Identify numeric columns
  const numericCols = headers.filter(h => rows.slice(0, 20).some(r => !isNaN(Number(r[h])) && r[h] !== ''));
  let outlierFound = false;

  for (const col of numericCols) {
    const vals = rows.map(r => Number(r[col])).filter(v => !isNaN(v));
    if (vals.length < 10) continue;
    
    vals.sort((a, b) => a - b);
    const q1 = vals[Math.floor(vals.length * 0.25)];
    const q3 = vals[Math.floor(vals.length * 0.75)];
    const iqr = q3 - q1;
    const upperLimit = q3 + 1.5 * iqr;
    const lowerLimit = q1 - 1.5 * iqr;

    const outliers = vals.filter(v => v > upperLimit || v < lowerLimit);
    if (outliers.length > 0 && outliers.length < vals.length * 0.05) { // Ensure it's truly an outlier and not just a skewed distribution
      alerts.push({
        id: `alert-outlier-${col}`,
        type: 'outlier',
        title: 'Budget / Numeric Outliers',
        description: `Found ${outliers.length} extreme values in column '${col}' outside expected range.`,
        severity: 'info',
      });
      outlierFound = true;
      break; // Just report one outlier alert to avoid spam
    }
  }

  // 4. Category Dominance Alert
  const categoricalCols = headers.filter(h => rows.slice(0, 20).some(r => isNaN(Number(r[h])) && r[h] !== ''));
  for (const col of categoricalCols) {
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const val = String(row[col] ?? '').trim();
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
      }
    }
    
    const maxCategory = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
    if (maxCategory[1] / totalRows > 0.8) {
      alerts.push({
        id: `alert-dominance-${col}`,
        type: 'category_dominance',
        title: 'Category Dominance',
        description: `Over 80% of records in '${col}' are '${maxCategory[0]}'. Low variance detected.`,
        severity: 'info',
      });
      break; // Just report one dominance alert
    }
  }

  // 5. Data Quality Alert
  const quality = calculateQualityScore(rows, headers);
  if (quality.score < 70) {
    alerts.push({
      id: 'alert-quality',
      type: 'data_quality',
      title: 'Poor Data Quality',
      description: `Overall quality score is ${quality.score}/100 (Grade ${quality.grade}). Review dataset for completeness and consistency.`,
      severity: quality.score < 50 ? 'critical' : 'warning',
    });
  }

  return alerts;
}
