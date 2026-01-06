const express = require('express');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

let urls = [];
let id = 1;

app.post('/api/shorturl', (req, res) => {
  const url = req.body.url;
  if (typeof url !== 'string' || !url.trim()) {
    return res.json({ error: 'invalid url' });
  }

  try {
    const u = new URL(url.trim());
    if (!u.protocol.startsWith('http')) {
      throw new Error();
    }
    const entry = { original_url: url, short_url: id++ };
    urls.push(entry);
    res.json(entry);
  } catch {
    res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:n', (req, res) => {
  const n = parseInt(req.params.n);
  const entry = urls.find(e => e.short_url === n);
  entry ? res.redirect(entry.original_url) : res.status(404).end();
});

app.get('/', (req, res) => {
  res.send('OK');
});

app.listen(3000, () => console.log('✅ Running on http://localhost:3000'));