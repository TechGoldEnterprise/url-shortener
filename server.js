const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// In-memory store (FCC tests don't require persistence)
let urls = [];
let nextId = 1;

// POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // ✅ No URL provided → invalid
  if (!originalUrl) {
    return res.json({ error: 'invalid url' });
  }

  try {
    // ✅ Parse & validate protocol
    const parsed = new URL(originalUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }

    // ✅ Validate hostname via DNS lookup
    const hostname = parsed.hostname;
    dns.lookup(hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // ✅ Valid → store & return
      const shortUrl = nextId++;
      urls.push({ original_url: originalUrl, short_url: shortUrl });
      res.json({ original_url: originalUrl, short_url: shortUrl });
    });
  } catch (e) {
    // ❌ Invalid format (e.g., no protocol, malformed)
    res.json({ error: 'invalid url' });
  }
});

// GET /api/shorturl/:short_url
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url, 10);
  const entry = urls.find(u => u.short_url === shortUrl);

  if (entry) {
    res.redirect(301, entry.original_url); // ✅ 301 redirect
  } else {
    res.status(404).json({ error: 'url not found' });
  }
});

// ✅ Optional: root route (prevents "Not Found" on homepage)
app.get('/', (req, res) => {
  res.status(200).send(`
    <h1>URL Shortener Microservice</h1>
    <p>Example POST:</p>
    <pre>{ "url": "https://freecodecamp.org" }</pre>
    <p>To: <code>/api/shorturl</code></p>
  `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Running on port ${PORT}`);
});