import React, {useState} from 'react';

const presetIdeas = [
  'Generate a Python CLI that audits folder sizes',
  'Build a Node.js Express API with one /tasks route',
  'Create a React todo widget with localStorage support'
];

export default function AnalyzeForm(){
  const [file, setFile] = useState(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState('paste');
  const [liveStats, setLiveStats] = useState({ lines: 0, chars: 0 });
  const [dragActive, setDragActive] = useState(false);

  const isReadyToAnalyze =
    (inputMode === 'upload' && !!file) ||
    (inputMode === 'paste' && code.trim().length > 0);

  function updateCode(nextCode){
    setCode(nextCode);
    const safe = nextCode || '';
    setLiveStats({
      lines: safe ? safe.split(/\r?\n/).length : 0,
      chars: safe.length
    });
  }

  function handleFileChange(selectedFile){
    setFile(selectedFile || null);
    if (selectedFile) {
      setInputMode('upload');
    }
  }

  async function handleAnalyze(e){
    e.preventDefault();
    if (!isReadyToAnalyze || loading) return;

    setResult(null);
    setLoading(true);
    const form = new FormData();
    if (inputMode === 'upload' && file) {
      form.append('file', file);
    } else {
      form.append('code', code);
    }

    try {
      const res = await fetch('http://localhost:4000/analyze', {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSample(presetDescription){
    const description = presetDescription || prompt('Describe what code or small app to generate (example: simple todo app in Python with Flask):');
    if (!description) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, language: 'javascript' })
      });
      const data = await res.json();
      if (data.generated) {
        updateCode(data.generated);
        setInputMode('paste');
      } else {
        setResult({ error: data.error || 'Generation failed' });
      }
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  }

  const metrics = result ? [
    { label: 'Total lines', value: result.totalLines },
    { label: 'Non-empty', value: result.nonEmptyLines },
    { label: 'Functions/classes', value: result.functionCount },
    { label: 'Avg line length', value: result.avgLineLength },
    { label: 'Complexity', value: result.complexityEstimate },
    { label: 'Long blocks', value: result.longBlocks?.length },
    { label: 'Duplicates', value: result.duplicates?.length },
    { label: 'TODOs', value: result.todos?.length }
  ].filter(metric => metric.value !== undefined && metric.value !== null) : [];

  function handleDragOver(e){
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e){
    e.preventDefault();
    setDragActive(false);
  }

  function handleDrop(e){
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) handleFileChange(dropped);
  }

  return (
    <section className="panel card">
      <form onSubmit={handleAnalyze}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Input mode</p>
            <div className="segmented-control" role="tablist" aria-label="Input mode toggle">
              <button
                type="button"
                className={inputMode === 'paste' ? 'active' : ''}
                aria-pressed={inputMode === 'paste'}
                onClick={() => setInputMode('paste')}
              >
                Paste code
              </button>
              <button
                type="button"
                className={inputMode === 'upload' ? 'active' : ''}
                aria-pressed={inputMode === 'upload'}
                onClick={() => setInputMode('upload')}
              >
                Upload file
              </button>
            </div>
          </div>
          <div className="live-stats">
            <div>
              <span>Lines</span>
              <strong>{liveStats.lines}</strong>
            </div>
            <div>
              <span>Characters</span>
              <strong>{liveStats.chars}</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>{inputMode === 'upload' ? 'File' : 'Editor'}</strong>
            </div>
          </div>
        </div>

        {inputMode === 'upload' ? (
          <div
            className={`file-drop ${dragActive ? 'file-drop--active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".py,.js,.ts,.txt,.java,.c,.cpp,.rs,.go,.zip"
              onChange={e => handleFileChange(e.target.files?.[0])}
            />
            <p>{file ? `Selected: ${file.name}` : 'Drag & drop your file or click to browse'}</p>
            <small>Supported: JS, TS, Python, Go, Java, text, zip.</small>
          </div>
        ) : (
          <div className="editor">
            <label htmlFor="code-editor">Paste code</label>
            <textarea
              id="code-editor"
              value={code}
              onChange={e => updateCode(e.target.value)}
              rows={14}
              placeholder="Paste or generate code to analyze complexity, TODOs, duplication and more..."
              spellCheck="false"
            />
          </div>
        )}

        <div className="action-row">
          <button type="submit" disabled={!isReadyToAnalyze || loading}>
            {loading ? 'Working…' : 'Run analysis'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => handleGenerateSample()} disabled={loading}>
            Generate code (AI)
          </button>
        </div>
      </form>

      <div className="prompt-chips">
        <span>Try a preset:</span>
        {presetIdeas.map(prompt => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleGenerateSample(prompt)}
            disabled={loading}
          >
            {prompt}
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading-pill" aria-live="polite">
          <span className="ping" />
          Processing request
        </div>
      )}

      {result && (
        <div className="result card">
          <div className="result-header">
            <h3>Analysis report</h3>
            {result.filename && <span className="badge badge-muted">{result.filename}</span>}
          </div>

          {result.error ? (
            <div className="callout callout-danger">
              <strong>Request failed:</strong> {result.error}
            </div>
          ) : (
            <>
              <div className="metrics-grid">
                {metrics.map(metric => (
                  <div className="metric-card" key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value ?? '—'}</strong>
                  </div>
                ))}
              </div>

              {result.issues?.length > 0 && (
                <div className="issue-list">
                  <p className="section-title">Flagged issues</p>
                  <ul>
                    {result.issues.map((issue, idx) => (
                      <li key={issue + idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.todos?.length > 0 && (
                <div className="issue-list">
                  <p className="section-title">TODO / FIXME mentions</p>
                  <ul>
                    {result.todos.map(todo => (
                      <li key={`${todo.line}-${todo.text}`}>
                        <span className="badge badge-muted">Line {todo.line}</span> {todo.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.suggestions?.length > 0 && (
                <div className="issue-list">
                  <p className="section-title">Suggestions</p>
                  <ul>
                    {result.suggestions.map(s => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <details className="raw-response">
            <summary>Raw JSON response</summary>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </section>
  );
}
