const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');
const app = express();
const port = process.env.PORT || 3000;

// In-memory store (FCC tests don’t require persistence)
let urls = [];
let nextId = 1;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Helper: validate URL format & DNS
function isValidUrl(str) {
  try {
    const parsed = new URL(str);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    // Extract hostname for DNS lookup
    const hostname = parsed.hostname;
    return new Promise((resolve) => {
      dns.lookup(hostname, (err) => {
        resolve(!err); // true if DNS resolves
      });
    });
  } catch (e) {
    return false;
  }
}

// POST /api/shorturl
app.post('/api/shorturl', async (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: 'invalid url' });
  }

  try {
    // Validate format first
    const parsed = new URL(originalUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }

    // Validate DNS
    const isValid = await isValidUrl(originalUrl);
    if (!isValid) {
      return res.json({ error: 'invalid url' });
    }

    // Save
    const shortUrl = nextId++;
    urls.push({ original_url: originalUrl, short_url: shortUrl });

    res.json({ original_url: originalUrl, short_url: shortUrl });
  } catch (e) {
    res.json({ error: 'invalid url' });
  }
});

// GET /api/shorturl/:short_url
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url, 10);
  const entry = urls.find(u => u.short_url === shortUrl);
  
  if (entry) {
    res.redirect(entry.original_url);
  } else {
    res.status(404).json({ error: 'url not found' });
  }
});

// Optional: root page
app.get('/', (req, res) => {
  res.send(`
    <h1>URL Shortener Microservice</h1>
    <p>POST to <code>/api/shorturl</code> with { "url": "https://example.com" }</p>
  `);
});

app.listen(port, () => {
  console.log(`✅ Running on port ${port}`);
});