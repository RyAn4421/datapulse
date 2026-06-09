import { calculateQualityScore } from './quality-score';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  type: 'missing_values' | 'duplicate_records' | 'outlier' | 'category_dominance' | 'data_quality';
}

export function generateSmartAlerts(rows: Record<string, unknown>[], headers: string[]): Alert[] {
  const alerts: Alert[] = [];
  if (!rows || rows.length === 0 || !headers || headers.length === 0) return alerts;

  const totalRows = rows.length;
  const totalCells = totalRows * headers.length;

  // 1. Missing Values Alert (High)
  let emptyCells = 0;
  const colsWithMissingSet = new Set<string>();
  for (const row of rows) {
    for (const header of headers) {
      const val = row[header];
      if (val === null || val === undefined || String(val).trim() === '' || String(val).trim().toUpperCase() === 'N/A') {
        emptyCells++;
        colsWithMissingSet.add(header);
      }
    }
  }
  const missingRatio = emptyCells / totalCells;
  if (missingRatio > 0.05) {
    alerts.push({
      id: 'alert-missing',
      type: 'missing_values',
      title: 'Missing Values Detected',
      description: `${(missingRatio * 100).toFixed(1)}% of values are missing across ${colsWithMissingSet.size} columns.`,
      severity: 'High',
    });
  }

  // 2. Duplicate Records Alert (High)
  const uniqueRows = new Set(rows.map((r) => JSON.stringify(r)));
  const duplicateCount = totalRows - uniqueRows.size;
  const duplicateRatio = duplicateCount / totalRows;
  
  if (duplicateRatio > 0.02) {
    alerts.push({
      id: 'alert-duplicates',
      type: 'duplicate_records',
      title: 'Duplicate Records Found',
      description: `${duplicateCount} duplicate records detected.`,
      severity: 'High',
    });
  }

  // Find categorical/numeric columns and label column
  const categoricalCols = headers.filter(h => rows.some(r => isNaN(Number(r[h])) && r[h] !== null && String(r[h]).trim() !== ''));
  const numericCols = headers.filter(h => !categoricalCols.includes(h));
  const labelCol = categoricalCols.length > 0 ? categoricalCols[0] : null;

  // 3. Budget Outlier Alert (Medium)
  for (const col of numericCols) {
    const validRows = rows.filter(r => !isNaN(Number(r[col])) && r[col] !== null && String(r[col]).trim() !== '');
    if (validRows.length < 10) continue;

    const vals = validRows.map(r => Number(r[col]));
    const sum = vals.reduce((a, b) => a + b, 0);
    const mean = sum / vals.length;
    
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    const std = Math.sqrt(variance);

    // Sort descending to find top 5% cutoff
    const sortedVals = [...vals].sort((a, b) => b - a);
    const top5Index = Math.floor(vals.length * 0.05);
    const top5Cutoff = top5Index < sortedVals.length ? sortedVals[top5Index] : sortedVals[0];

    const cutoff = Math.min(mean + 2 * std, top5Cutoff);

    // Find first outlier
    const outlierRow = validRows.find(r => Number(r[col]) > cutoff);
    
    if (outlierRow && mean > 0) {
      const val = Number(outlierRow[col]);
      const ratio = (val / mean).toFixed(1);
      const label = labelCol ? String(outlierRow[labelCol]) : `Row ${rows.indexOf(outlierRow) + 1}`;
      
      alerts.push({
        id: `alert-outlier-${col}`,
        type: 'outlier',
        title: 'Budget Outlier Detected',
        description: `Budget outlier detected: ${label} is ${ratio}x above average.`,
        severity: 'Medium',
      });
      break; // Only one outlier alert to prevent spam
    }
  }

  // 4. Category Dominance Alert (Medium)
  for (const col of categoricalCols) {
    const counts: Record<string, number> = {};
    let validCount = 0;
    
    for (const row of rows) {
      const val = String(row[col] ?? '').trim();
      if (val !== '' && val.toUpperCase() !== 'N/A') {
        counts[val] = (counts[val] || 0) + 1;
        validCount++;
      }
    }
    
    const uniqueValues = Object.keys(counts).length;
    // Applies to: All columns with fewer than 20 unique string values.
    if (uniqueValues > 0 && uniqueValues < 20) {
      const maxCategory = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
      const ratio = maxCategory[1] / totalRows; // as per spec, proportion of total records
      
      if (ratio > 0.4) {
        alerts.push({
          id: `alert-dominance-${col}`,
          type: 'category_dominance',
          title: 'Category Dominance',
          description: `${maxCategory[0]} represents ${(ratio * 100).toFixed(1)}% of all records in ${col}.`,
          severity: 'Medium',
        });
        break; // Only one dominance alert to prevent spam
      }
    }
  }

  // 5. Data Quality Alert (Low)
  const quality = calculateQualityScore(rows, headers);
  if (quality.score < 75) {
    alerts.push({
      id: 'alert-quality',
      type: 'data_quality',
      title: 'Poor Data Quality',
      description: `Data quality score is ${quality.score}%. Review missing values and formatting.`,
      severity: 'Low',
    });
  }

  return alerts;
}
