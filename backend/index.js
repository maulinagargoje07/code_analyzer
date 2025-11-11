const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const analyze = require('./analyzer');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json({limit: '10mb'}));

const upload = multer({ dest: 'uploads/' });

app.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    let code = '';
    let filename = '';
    if (req.file) {
      filename = req.file.originalname;
      code = fs.readFileSync(req.file.path, 'utf8');
      fs.unlinkSync(req.file.path);
    } else if (req.body.code) {
      code = req.body.code;
      filename = req.body.filename || 'pasted_code.txt';
    } else {
      return res.status(400).json({ error: 'No file or code provided.' });
    }

    const report = analyze.simpleAnalyze(code, filename);

    // If OPENAI_API_KEY is present, ask OpenAI for suggestions (optional)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const prompt = `You are a helpful code reviewer. Provide concise suggestions, potential flaws, and improvements for the following code. Filename: ${filename}\n\n${code}\n\nProvide JSON with keys: summary, issues (list), suggestions (list).`;
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + openaiKey
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 800,
            temperature: 0.2
          })
        });
        const data = await resp.json();
        let text = '';
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
          text = data.choices[0].message.content;
        } else {
          text = JSON.stringify(data);
        }
        // Attach AI response raw text (not parsed) to the report
        report.ai_review = text;
      } catch (e) {
        report.ai_error = 'OpenAI request failed: ' + String(e.message || e);
      }
    } else {
      report.ai_note = 'No OPENAI_API_KEY provided. To enable AI suggestions, set OPENAI_API_KEY as environment variable.';
    }

    return res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/generate', async (req, res) => {
  try {
    const { description, language } = req.body || {};
    if (!description) return res.status(400).json({ error: 'description required' });

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return res.status(400).json({ error: 'OPENAI_API_KEY not set on server. This endpoint requires an API key.' });

    const prompt = `Generate a concise ${language || 'Python'} program or project scaffold based on this description:\n\n${description}\n\nProvide only the code or a zip-friendly file tree with code files. Keep it runnable.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + openaiKey
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1600,
        temperature: 0.2
      })
    });
    const data = await resp.json();
    let text = '';
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      text = data.choices[0].message.content;
    } else {
      text = JSON.stringify(data);
    }
    res.json({ generated: text });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Backend listening on port', PORT);
});