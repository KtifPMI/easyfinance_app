require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { buildSig, toQueryString } = require('./sign');

const APP_ID = process.env.EASYFINANCE_APP_ID;
const SECRET_KEY = process.env.EASYFINANCE_SECRET_KEY;
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || 'easyfinanceapp://oauth-callback';
const API_BASE = 'https://api.easyfinance.ru/v2/';

if (!APP_ID || !SECRET_KEY) {
  console.warn(
    '[easyfinance-proxy] EASYFINANCE_APP_ID / EASYFINANCE_SECRET_KEY не заданы в .env. ' +
      'Запросы к EasyFinance API будут возвращать ошибку, пока вы их не укажете.'
  );
}

const app = express();
app.use(cors());
app.use(express.json());

function ensureCredentials(res) {
  if (!APP_ID || !SECRET_KEY) {
    res.status(500).json({
      error: 'server_not_configured',
      message: 'EASYFINANCE_APP_ID / EASYFINANCE_SECRET_KEY не заданы на сервере (.env)',
    });
    return false;
  }
  return true;
}

/**
 * Шаг 1 OAuth: получить URL, на который должен перейти пользователь
 * (открывается через expo-web-browser, НЕ WebView), чтобы разрешить
 * приложению доступ к своим данным. EasyFinance в ответ редиректит
 * на https://api.easyfinance.ru/v2/result?code=... либо ?access_denied.
 */
app.get('/oauth/authorize-url', (req, res) => {
  if (!ensureCredentials(res)) return;

  const params = toQueryString({ app_id: APP_ID, response_type: 'code' });
  const sig = buildSig({ secretKey: SECRET_KEY, params });

  const url = `${API_BASE}?${params}&sig=${sig}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.json({ url });
});

/**
 * Шаг 5 OAuth: обменять request_token (code) на access_token.
 * Вызывается мобильным приложением после того, как браузер вернул
 * deep link easyfinanceapp://oauth-callback?code=...
 */
app.post('/oauth/token', async (req, res) => {
  if (!ensureCredentials(res)) return;

  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'invalid_request', message: 'Параметр code обязателен' });
  }

  const params = toQueryString({
    app_id: APP_ID,
    code,
    grant_type: 'authorization_code',
    response_type: 'token',
  });
  const sig = buildSig({ secretKey: SECRET_KEY, params });

  try {
    const url = `${API_BASE}?${params}&sig=${sig}`;
    // EasyFinance отвечает на этот шаг редиректом на
    // https://api.easyfinance.ru/v2/result?access_token=...&expires_in=...
    // fetch по умолчанию следует за редиректом, поэтому смотрим
    // итоговый URL в efRes.url, а не только тело ответа.
    const efRes = await fetch(url, { redirect: 'follow' });

    const finalUrl = new URL(efRes.url);
    const accessToken = finalUrl.searchParams.get('access_token');
    const expiresIn = finalUrl.searchParams.get('expires_in');
    const accessDenied = finalUrl.searchParams.has('access_denied');

    if (accessDenied) {
      return res.status(403).json({ error: 'access_denied' });
    }

    if (accessToken) {
      return res.json({ access_token: accessToken, expires_in: expiresIn });
    }

    // Если редиректа не было — пробуем разобрать тело как JSON.
    let data;
    try {
      data = await efRes.json();
    } catch {
      return res.status(502).json({ error: 'unexpected_response', message: 'Не удалось разобрать ответ EasyFinance' });
    }

    if (!efRes.ok || data.error) {
      return res.status(efRes.status || 400).json({ error: 'easyfinance_error', details: data });
    }

    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'proxy_error', message: String(err) });
  }
});

/**
 * Универсальный прокси для всех остальных методов API
 * (users.get, accounts.get/post/set, operations.get/post/set,
 * categories.*, budget.get, tags.get, currencies.get, systemCategories.get
 * и т.д.)
 *
 * Тело запроса:
 * {
 *   "method": "operations.get",
 *   "httpMethod": "GET" | "POST",   // необязательно, по умолчанию GET
 *   "access_token": "...",
 *   "uid": "47736089",               // обязателен для всех запросов кроме users.get
 *   "params": { "fields": "balance" }, // дополнительные GET-параметры
 *   "body": { "request": { ... } }     // тело POST-запроса (request_data)
 * }
 */
app.post('/api/call', async (req, res) => {
  if (!ensureCredentials(res)) return;

  const { method, httpMethod = 'GET', access_token, uid, params: extraParams = {}, body } = req.body || {};

  if (!method) {
    return res.status(400).json({ error: 'invalid_request', message: 'Параметр method обязателен' });
  }
  if (!access_token) {
    return res.status(401).json({ error: 'unauthorized', message: 'access_token обязателен' });
  }

  const params = toQueryString({ method, app_id: APP_ID, access_token, ...extraParams });
  const sig = buildSig({ secretKey: SECRET_KEY, uid, params });
  const url = `${API_BASE}?${params}&sig=${sig}`;

  try {
    const efRes = await fetch(url, {
      method: httpMethod,
      headers: httpMethod === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: httpMethod === 'POST' ? JSON.stringify(body || {}) : undefined,
    });

    const data = await efRes.json();

    if (data?.response?.response_data?.error || data?.error) {
      return res.status(400).json({ error: 'easyfinance_error', details: data });
    }

    res.status(efRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'proxy_error', message: String(err) });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`easyfinance-proxy listening on http://localhost:${PORT}`);
});
