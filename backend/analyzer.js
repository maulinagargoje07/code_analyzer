// analyzer.js
// Simple heuristic static analyzer for demo purposes.

function simpleAnalyze(code, filename='code.txt') {
  const lines = code.split(/\r?\n/);
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter(l => l.trim() !== '').length;
  const charCount = code.length;
  const avgLineLength = Math.round(charCount / Math.max(1, totalLines));

  // Count functions (simple heuristics for JS/Python)
  const functionRegexes = [
    /^\s*def\s+\w+\s*\(/,      // python
    /^\s*function\s+\w+\s*\(/, // js
    /^\s*\w+\s*=\s*\(\)\s*=>/, // js arrow
    /^\s*class\s+\w+/,         // class
  ];
  let functionCount = 0;
  lines.forEach(l => {
    for (const r of functionRegexes) {
      if (r.test(l)) { functionCount++; break; }
    }
  });

  // Detect TODOs, FIXMEs
  const todos = lines.map((l,i) => ({line: i+1, text: l.trim()})).filter(o => /TODO|FIXME|XXX/i.test(o.text));

  // Detect long functions (naive: consecutive lines without blank lines > threshold)
  let longBlocks = [];
  let blockStart = null, blockLen = 0;
  for (let i=0;i<lines.length;i++){
    if (lines[i].trim() === '') {
      if (blockLen >= 50) longBlocks.push({start: blockStart+1, length: blockLen});
      blockStart = null; blockLen = 0;
    } else {
      if (blockStart === null) blockStart = i;
      blockLen++;
    }
  }
  if (blockLen >= 50) longBlocks.push({start: blockStart+1, length: blockLen});

  // Simple duplication detection: check repeated line sequences (3-line window)
  const seqMap = {};
  for (let i=0;i<lines.length-2;i++){
    const seq = lines.slice(i,i+3).join('\n').trim();
    if (seq.length < 5) continue;
    seqMap[seq] = seqMap[seq] || [];
    seqMap[seq].push(i+1);
  }
  const duplicates = [];
  for (const k in seqMap) {
    if (seqMap[k].length > 1) duplicates.push({occurrences: seqMap[k].length, lines: seqMap[k].slice(0,5)});
  }

  const complexityEstimate = Math.min(10, Math.round((functionCount * 1.5) + (nonEmptyLines/200)));

  const issues = [];
  if (functionCount === 0) issues.push('No functions or classes detected — consider modularizing code.');
  if (todos.length) issues.push(`${todos.length} TODO/FIXME comments found.`);
  if (longBlocks.length) issues.push(`${longBlocks.length} long code blocks (>50 lines) detected — consider refactoring.`);
  if (duplicates.length) issues.push(`${duplicates.length} duplicated code blocks detected.`);
  if (avgLineLength > 120) issues.push('Very long average line length — consider wrapping lines or improving readability.');

  const suggestions = [
    'Add function/class level docstrings and comments for clarity.',
    'Break very long blocks into smaller functions or modules.',
    'Remove or resolve TODO/FIXME items.',
    'Create more tests for critical modules (not implemented here).',
    'Use linters and formatters (e.g., eslint/black) as part of CI.'
  ];

  return {
    filename,
    totalLines,
    nonEmptyLines,
    charCount,
    avgLineLength,
    functionCount,
    complexityEstimate,
    todos,
    longBlocks,
    duplicates,
    issues,
    suggestions
  };
}

module.exports = { simpleAnalyze };