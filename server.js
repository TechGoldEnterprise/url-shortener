const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

// ✅ CORS — required for FCC test runner
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(bodyParser.json());

let urls = [];
let nextId = 1;

app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url; // keep original, including spaces

  // Must be string
  if (typeof inputUrl !== 'string') {
    return res.json({ error: 'invalid url' });
  }

  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return res.json({ error: 'invalid url' });
  }

  try {
    // Validate the *trimmed* version
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }

    // DNS lookup on hostname
    dns.lookup(parsed.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // ✅ Store & return *original* inputUrl (with spaces, as FCC expects)
      const shortUrl = nextId++;
      urls.push({ original_url: inputUrl, short_url: shortUrl });
      res.json({ original_url: inputUrl, short_url: shortUrl });
    });
  } catch (e) {
    res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url, 10);
  const entry = urls.find(u => u.short_url === shortUrl);

  if (entry) {
    res.redirect(301, entry.original_url); // 301 = permanent redirect
  } else {
    res.status(404).json({ error: 'url not found' });
  }
});

// Optional: root route
app.get('/', (req, res) => {
  res.status(200).send('<h1>URL Shortener Microservice</h1>');
});

app.listen(process.env.PORT || 3000);