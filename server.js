const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

// ✅ Enable CORS (required for FCC browser-based tests)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ✅ Parse JSON bodies
app.use(bodyParser.json());

// In-memory store
let urls = [];
let nextId = 1;

// ✅ POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: 'invalid url' });
  }

  try {
    // Parse and validate URL format
    const parsed = new URL(originalUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }

    // ✅ DNS lookup (as per FCC hint)
    dns.lookup(parsed.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // Save and respond
      const shortUrl = nextId++;
      urls.push({ original_url: originalUrl, short_url: shortUrl });
      res.json({
        original_url: originalUrl,
        short_url: shortUrl
      });
    });
  } catch (e) {
    res.json({ error: 'invalid url' });
  }
});

// ✅ GET /api/shorturl/:short_url → redirect
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url, 10);
  const entry = urls.find(u => u.short_url === shortUrl);

  if (entry) {
    res.redirect(301, entry.original_url);
  } else {
    res.status(404).json({ error: 'url not found' });
  }
});

// ✅ Root route (prevents "Not Found" on homepage)
app.get('/', (req, res) => {
  res.status(200).send(`
    <h1>URL Shortener Microservice</h1>
    <p>POST { "url": "https://example.com" } to <code>/api/shorturl</code></p>
  `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});