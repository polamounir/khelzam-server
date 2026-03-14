import crypto from 'crypto';
import RequestLog from '../models/RequestLog.js';

const dbLogger = async (req, res, next) => {
  // 0. Ignore OPTIONS requests (CORS preflight) to avoid "double logging"
  if (req.method === 'OPTIONS') {
    return next();
  }

  // 1. Capture Client-Side Fingerprint (if provided)
  const clientFingerprint = req.body?.deviceFingerprint || req.headers?.['x-device-fingerprint'] || null;

  // 2. Generate Server-Side Fingerprint (Always)
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const serverFingerprint = crypto
    .createHash('md5')
    .update(`${ip}-${userAgent}`)
    .digest('hex');

  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    headers: { ...req.headers },
    body: req.method !== 'GET' ? { ...req.body } : {},
    query: { ...req.query },
    ip: ip,
    adminId: req.admin ? req.admin._id : null,
    clientFingerprint,
    serverFingerprint
  };

  // Remove sensitive data from logged body if it exists
  if (logData.body.password) logData.body.password = '[REDACTED]';

  // Save to DB asynchronously (fire and forget to minimize latency)
  setImmediate(() => {
    RequestLog.create(logData).catch(err => console.error('Logging Error:', err));
  });

  next();
};

export default dbLogger;
