export interface QualityScoreResult {
  score: number;
  grade: string;
  breakdown: {
    completeness: number;
    duplicate: number;
    consistency: number;
    formatting: number;
  };
}

export function calculateQualityScore(
  rows: Record<string, unknown>[],
  headers: string[]
): QualityScoreResult {
  if (!rows || rows.length === 0 || !headers || headers.length === 0) {
    return {
      score: 0,
      grade: 'Needs Attention',
      breakdown: { completeness: 0, duplicate: 0, consistency: 0, formatting: 0 },
    };
  }

  const totalRows = rows.length;
  const totalCells = totalRows * headers.length;

  // 1. Completeness (40%)
  // Empty cell = null, blank string, or "N/A" literal
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
  const completenessScore = Math.max(0, ((totalCells - emptyCells) / totalCells) * 100);

  // 2. Duplicate (30%)
  // Duplicate row = all column values identical to another row
  const uniqueRows = new Set(rows.map((r) => JSON.stringify(r)));
  const duplicateScore = Math.max(0, (uniqueRows.size / totalRows) * 100);

  // 3. Consistency (20%)
  // Consistency Score = (Rows passing type checks) / Total rows * 100
  // First, determine dominant type for each column
  const columnDominantTypes: Record<string, 'numeric' | 'string'> = {};
  for (const header of headers) {
    let numCount = 0;
    let strCount = 0;
    for (const row of rows) {
      const val = row[header];
      if (val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim().toUpperCase() !== 'N/A') {
        if (!isNaN(Number(val))) numCount++;
        else strCount++;
      }
    }
    columnDominantTypes[header] = numCount > strCount ? 'numeric' : 'string';
  }

  // Row-level check: a row passes if ALL cells conform to the column's dominant type
  let consistentRows = 0;
  for (const row of rows) {
    let rowPasses = true;
    for (const header of headers) {
      const val = row[header];
      const isEmpty = val === null || val === undefined || String(val).trim() === '' || String(val).trim().toUpperCase() === 'N/A';
      
      // Empty cells are ignored for consistency type checking (already penalized in completeness)
      if (!isEmpty) {
        const isNumeric = !isNaN(Number(val));
        const dominantType = columnDominantTypes[header];
        if (dominantType === 'numeric' && !isNumeric) {
          rowPasses = false;
          break;
        }
        // If dominant type is string, anything passes (numbers can be parsed as strings)
      }
    }
    if (rowPasses) consistentRows++;
  }
  const consistencyScore = Math.max(0, (consistentRows / totalRows) * 100);

  // 4. Formatting (10%)
  // Formatting Score = (Columns with consistent formats) / Total columns * 100
  let consistentColumns = 0;
  for (const header of headers) {
    let hasWhitespaceIssue = false;
    let hasInconsistentCasing = false;
    let textValuesCount = 0;

    let upperCount = 0;
    let lowerCount = 0;

    for (const row of rows) {
      const val = row[header];
      if (val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim().toUpperCase() !== 'N/A') {
        const strVal = String(val);
        // Whitespace check
        if (strVal !== strVal.trim()) {
          hasWhitespaceIssue = true;
        }
        // Casing check (for non-numeric strings)
        if (isNaN(Number(strVal))) {
          textValuesCount++;
          if (strVal === strVal.toUpperCase()) upperCount++;
          if (strVal === strVal.toLowerCase()) lowerCount++;
        }
      }
    }

    // If there are text values, they should have consistent casing
    // It's inconsistent if some are uppercase and some are lowercase
    if (textValuesCount > 0) {
      if (upperCount > 0 && lowerCount > 0 && upperCount !== textValuesCount && lowerCount !== textValuesCount) {
        // Just a heuristic for mixed casing
        hasInconsistentCasing = true;
      }
    }

    if (!hasWhitespaceIssue && !hasInconsistentCasing) {
      consistentColumns++;
    }
  }
  const formattingScore = Math.max(0, (consistentColumns / headers.length) * 100);

  // Final Weighted Score
  const finalScore =
    completenessScore * 0.4 +
    duplicateScore * 0.3 +
    consistencyScore * 0.2 +
    formattingScore * 0.1;

  const roundedScore = Math.round(finalScore);

  let grade = 'Needs Attention';
  if (roundedScore >= 90) grade = 'Excellent';
  else if (roundedScore >= 75) grade = 'Good';
  else if (roundedScore >= 60) grade = 'Fair';

  return {
    score: roundedScore,
    grade,
    breakdown: {
      completeness: Math.round(completenessScore),
      duplicate: Math.round(duplicateScore),
      consistency: Math.round(consistencyScore),
      formatting: Math.round(formattingScore),
    },
  };
}
