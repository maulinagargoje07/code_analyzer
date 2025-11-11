import React from 'react';
import AnalyzeForm from './components/AnalyzeForm';

export default function App(){
  const heroHighlights = [
    'Static signals for any language snippet',
    'Find TODO/FIXME, long blocks, duplicates',
    'Optional AI-powered sample code generation'
  ];

  const sideNotes = [
    { title: 'Heuristic Scan', detail: 'Line counts, average length, complexity, TODOs, duplication and more.' },
    { title: 'AI Samples', detail: 'Jump-start experiments without leaving the playground (requires backend key).' },
    { title: 'Privacy first', detail: 'Files never leave your machine beyond the local Node backend.' }
  ];

  return (
    <div className="page">
      <span className="glow glow-one" />
      <span className="glow glow-two" />

      <header className="hero card">
        <div className="hero-copy">
          <p className="eyebrow">Prototype workspace</p>
          <h1>Modern code analyzer playground</h1>
          <p className="hero-subtitle">
            Drop a file or paste inline, run the heuristic scanner, and optionally ask the AI generator for quick reference implementations.
          </p>
          <ul className="hero-highlights">
            {heroHighlights.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="hero-panel">
          <div className="hero-pill">
            <span className="badge">Live feedback</span>
            <h3>Interactive workflow</h3>
            <p>Input stats update as you type and results render as rich cards.</p>
          </div>
          <div className="hero-mini-grid">
            <div>
              <p className="mini-label">Detections</p>
              <strong>TODOs · Duplicates · Long blocks</strong>
            </div>
            <div>
              <p className="mini-label">AI Assist</p>
              <strong>Sample snippets in seconds</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="layout">
        <AnalyzeForm />
        <section className="side-panel card">
          <p className="eyebrow">Quick facts</p>
          <h2>What&apos;s inside</h2>
          <div className="side-list">
            {sideNotes.map(note => (
              <article key={note.title}>
                <h3>{note.title}</h3>
                <p>{note.detail}</p>
              </article>
            ))}
          </div>
          <div className="side-footer">
            <span className="badge badge-muted">Beta</span>
            <p>Enable OPENAI_API_KEY on the backend to unlock AI generation.</p>
          </div>
        </section>
      </main>

      <footer>
        <small>Prototype · Local-only analysis · Built for rapid experiments.</small>
      </footer>
    </div>
  );
}
