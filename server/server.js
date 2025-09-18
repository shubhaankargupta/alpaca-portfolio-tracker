/*
 * Simple Node.js server for the MacroStrat portfolio dashboard.
 *
 * This server exposes a single API endpoint (/api/dashboard) that proxies
 * requests to the Alpaca API and computes summary metrics.  All other
 * requests are served as static files from the `src/` directory.  The
 * primary purpose of this server is to protect your API keys – they never
 * need to be exposed to the client.
 *
 * Environment variables required:
 *   APCA_API_KEY_ID      – your Alpaca API key
 *   APCA_API_SECRET_KEY  – your Alpaca secret key
 *   APCA_API_BASE_URL    – (optional) base URL, defaults to paper trading
 *   PORT                 – port to listen on, defaults to 3000
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from a `.env` file if present.
// We avoid using external dependencies here. Instead we perform a simple
// key=value parse and set variables on process.env. Lines beginning
// with `#` are treated as comments.
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  const contents = fs.readFileSync(envFile, 'utf-8');
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      return;
    }
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  });
}

const API_KEY = process.env.APCA_API_KEY_ID;
const SECRET_KEY = process.env.APCA_API_SECRET_KEY;
const ALPACA_HOST = process.env.APCA_API_BASE_URL || 'paper-api.alpaca.markets';

/**
 * Perform a GET request against the Alpaca API.
 */
function alpacaGet(endpoint) {
  return new Promise((resolve, reject) => {
    if (!API_KEY || !SECRET_KEY) {
      reject(new Error('Missing Alpaca API credentials. Check your .env file.'));
      return;
    }
    const options = {
      hostname: ALPACA_HOST,
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'APCA-API-KEY-ID': API_KEY,
        'APCA-API-SECRET-KEY': SECRET_KEY,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error(`Failed to parse JSON from Alpaca: ${err.message}`));
          }
        } else {
          reject(new Error(`Alpaca API responded with status ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

/**
 * Compute basic portfolio metrics from history data.
 */
function computeMetrics(history) {
  if (!history || !Array.isArray(history.equity) || !Array.isArray(history.timestamp)) {
    return { annualizedReturn: 0, sharpeRatio: 0, totalReturn: 0 };
  }
  const equity = history.equity.map((e) => parseFloat(e)).filter((e) => Number.isFinite(e));
  const ts = history.timestamp.map((t) => parseInt(t, 10)).filter((t) => Number.isFinite(t));
  const n = Math.min(equity.length, ts.length);
  if (n < 2) {
    return { annualizedReturn: 0, sharpeRatio: 0, totalReturn: 0 };
  }
  const valid = [];
  for (let i = 0; i < n; i++) {
    if (equity[i] > 0) {
      valid.push([equity[i], ts[i]]);
    }
  }
  if (valid.length < 2) {
    return { annualizedReturn: 0, sharpeRatio: 0, totalReturn: 0 };
  }
  const eq = valid.map((p) => p[0]);
  const dates = valid.map((p) => p[1]);
  const returns = [];
  for (let i = 1; i < eq.length; i++) {
    const r = (eq[i] - eq[i - 1]) / eq[i - 1];
    if (Number.isFinite(r)) returns.push(r);
  }
  if (returns.length < 2) {
    return { annualizedReturn: 0, sharpeRatio: 0, totalReturn: 0 };
  }
  const first = eq[0];
  const last = eq[eq.length - 1];
  const totalReturn = last / first - 1;
  const days = (dates[dates.length - 1] - dates[0]) / 86400;
  let annualizedReturn = 0;
  if (days > 0) {
    const years = days / 365.25;
    if (years > 0) {
      annualizedReturn = Math.pow(last / first, 1 / years) - 1;
    }
  }
  const mean = returns.reduce((s, x) => s + x, 0) / returns.length;
  const variance = returns.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / (returns.length - 1);
  const std = Math.sqrt(variance);
  const sharpeRatio = std > 0 ? (mean / std) * Math.sqrt(252) : 0;
  return {
    annualizedReturn: Number.isFinite(annualizedReturn) ? annualizedReturn : 0,
    sharpeRatio: Number.isFinite(sharpeRatio) ? sharpeRatio : 0,
    totalReturn: Number.isFinite(totalReturn) ? totalReturn : 0,
  };
}

/**
 * Build the dashboard response by fetching data from Alpaca.
 */
async function buildDashboard() {
  // fetch data in parallel
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const after = threeMonthsAgo.toISOString().split('T')[0];
  const [positions, history, orders, fills] = await Promise.all([
    alpacaGet('/v2/positions'),
    alpacaGet('/v2/account/portfolio/history?period=1A&timeframe=1D'),
    alpacaGet('/v2/orders?status=all&limit=100'),
    alpacaGet(`/v2/account/activities/FILL?after=${after}&direction=desc&limit=1000`),
  ]);
  const metrics = computeMetrics(history);
  // Normalise fills
  const processedFills = Array.isArray(fills)
    ? fills.map((fill) => {
        const qty = parseFloat(fill.qty) || 0;
        const price = parseFloat(fill.price) || 0;
        return {
          symbol: fill.symbol,
          side: fill.side,
          qty,
          price,
          transaction_time: fill.transaction_time,
          total_amount: qty * price,
        };
      })
    : [];
  return { positions: positions || [], history: history || {}, orders: orders || [], metrics, fills: processedFills };
}

// Basic MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * HTTP request handler
 */
function requestHandler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  // API endpoints
  if (pathname.startsWith('/api/')) {
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    };
    if (pathname === '/api/dashboard') {
      buildDashboard()
        .then((data) => {
          res.writeHead(200, headers);
          res.end(JSON.stringify(data));
        })
        .catch((err) => {
          res.writeHead(500, headers);
          res.end(JSON.stringify({ error: err.message, positions: [], fills: [], metrics: { annualizedReturn: 0, sharpeRatio: 0, totalReturn: 0 } }));
        });
      return;
    }
    res.writeHead(404, headers);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
    return;
  }
  // Serve static files from src directory
  const STATIC_DIR = path.join(__dirname, '..', 'src');
  let filePath = path.join(STATIC_DIR, pathname);
  // Default to index.html
  if (pathname === '/' || pathname === '') {
    filePath = path.join(STATIC_DIR, 'index.html');
  }
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
      res.end(content);
    }
  });
}

// Start the server
const port = parseInt(process.env.PORT, 10) || 3000;
http.createServer(requestHandler).listen(port, () => {
  console.log(`MacroStrat dashboard server is running at http://localhost:${port}`);
  console.log(`Using Alpaca host: ${ALPACA_HOST}`);
});