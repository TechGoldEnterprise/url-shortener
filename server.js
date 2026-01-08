const express = require('express');
const dns = require('dns'); // included per hint
const app = express();

// ✅ Body parsing middleware (required by FCC)
app.use(express.json());

// ✅ CORS for browser-based tests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

let urls = [];
let nextId = 1;

app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;
  if (typeof inputUrl !== 'string') {
    return res.json({ error: 'invalid url' });
  }

  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return res.json({ error: 'invalid url' });
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.protocol.startsWith('http')) {
      throw new Error();
    }

    // ✅ Use dns.lookup as hinted — but with timeout guard
    let dnsResolved = false;
    const timeout = setTimeout(() => {
      if (!dnsResolved) {
        dnsResolved = true;
        // ✅ Fallback: accept valid format if DNS hangs
        const shortUrl = nextId++;
        urls.push({ original_url: inputUrl, short_url: shortUrl });
        res.json({ original_url: inputUrl, short_url: shortUrl });
      }
    }, 1000); // 1s timeout

    dns.lookup(parsed.hostname, { family: 4 }, (err) => {
      if (!dnsResolved) {
        dnsResolved = true;
        clearTimeout(timeout);
        if (err) {
          return res.json({ error: 'invalid url' });
        }
        const shortUrl = nextId++;
        urls.push({ original_url: inputUrl, short_url: shortUrl });
        res.json({ original_url: inputUrl, short_url: shortUrl });
      }
    });
  } catch (e) {
    res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const id = parseInt(req.params.short_url, 10);
  const entry = urls.find(u => u.short_url === id);
  if (entry) {
    res.redirect(301, entry.original_url);
  } else {
    res.status(404).end();
  }
});

app.get('/', (req, res) => {
  res.send('# URL Shortener\nPOST { "url": "https://example.com" } to /api/shorturl');
});

app.listen(process.env.PORT || 3000);