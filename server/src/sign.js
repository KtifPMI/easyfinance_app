const crypto = require('crypto');

/**
 * EasyFinance.ru sig formula (см. документацию, п.12 "Подпись запроса"):
 *
 *   sig = md5(secret_key + uid? + params)
 *
 * где `params` — это query-строка запроса (без sig), а `uid` добавляется
 * только если запрос требует пользователя (не нужен на шаге получения
 * request_token / access_token).
 */
function buildSig({ secretKey, uid, params }) {
  const raw = `${secretKey}${uid || ''}${params}`;
  return crypto.createHash('md5').update(raw, 'utf8').digest('hex');
}

/**
 * Сериализует объект параметров в query-строку в том порядке, в котором
 * они переданы (порядок важен только для воспроизводимости — сервер
 * EasyFinance ожидает ту же строку, которая реально уйдёт в запросе).
 */
function toQueryString(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

module.exports = { buildSig, toQueryString };
