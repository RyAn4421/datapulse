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
      grade: 'F',
      breakdown: { completeness: 0, duplicate: 0, consistency: 0, formatting: 0 },
    };
  }

  const totalRows = rows.length;
  const totalCells = totalRows * headers.length;

  // 1. Completeness (40%)
  let emptyCells = 0;
  for (const row of rows) {
    for (const header of headers) {
      const val = row[header];
      if (val === null || val === undefined || String(val).trim() === '') {
        emptyCells++;
      }
    }
  }
  const completenessScore = Math.max(0, ((totalCells - emptyCells) / totalCells) * 100);

  // 2. Duplicate (30%)
  const uniqueRows = new Set(rows.map((r) => JSON.stringify(r)));
  const duplicateScore = Math.max(0, (uniqueRows.size / totalRows) * 100);

  // 3. Consistency (20%)
  // Check if columns have consistent data types (number vs string)
  let consistencyScore = 0;
  let totalConsistencyScores = 0;

  for (const header of headers) {
    let numCount = 0;
    let strCount = 0;
    let totalNonEmpty = 0;

    for (const row of rows) {
      const val = row[header];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        totalNonEmpty++;
        if (!isNaN(Number(val))) {
          numCount++;
        } else {
          strCount++;
        }
      }
    }

    if (totalNonEmpty > 0) {
      const majorityRatio = Math.max(numCount, strCount) / totalNonEmpty;
      totalConsistencyScores += majorityRatio * 100;
    } else {
      totalConsistencyScores += 100; // Empty columns are technically consistent
    }
  }
  consistencyScore = totalConsistencyScores / headers.length;

  // 4. Formatting (10%)
  // Check for leading/trailing spaces or messy capitalization
  let formattingIssues = 0;
  let textCells = 0;

  for (const row of rows) {
    for (const header of headers) {
      const val = row[header];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        const strVal = String(val);
        if (isNaN(Number(strVal))) {
          textCells++;
          // Issue if leading/trailing whitespace
          if (strVal !== strVal.trim()) {
            formattingIssues++;
          }
        }
      }
    }
  }

  const formattingScore = textCells > 0
    ? Math.max(0, ((textCells - formattingIssues) / textCells) * 100)
    : 100; // if no text, formatting is fine

  // Final Weighted Score
  const finalScore =
    completenessScore * 0.4 +
    duplicateScore * 0.3 +
    consistencyScore * 0.2 +
    formattingScore * 0.1;

  const roundedScore = Math.round(finalScore);

  let grade = 'F';
  if (roundedScore >= 90) grade = 'A';
  else if (roundedScore >= 80) grade = 'B';
  else if (roundedScore >= 70) grade = 'C';
  else if (roundedScore >= 60) grade = 'D';

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
