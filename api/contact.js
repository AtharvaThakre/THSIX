/**
 * POST /api/contact
 *
 * Accepts a contact form submission, validates it server-side,
 * implements basic in-memory rate limiting, and delivers the
 * message to support@thsix.com via the Resend email API.
 *
 * Environment variables (set in Vercel dashboard):
 *   RESEND_API_KEY        — Resend API key (re_...)
 *   SUPPORT_EMAIL         — destination inbox  (support@thsix.com)
 *   CONTACT_FROM_EMAIL    — verified sender     (e.g. noreply@thsix.com)
 */

const { Resend } = require('resend');

// ─── Configuration ────────────────────────────────────────────────────────────

const RESEND_API_KEY     = process.env.RESEND_API_KEY     || '';
const SUPPORT_EMAIL      = process.env.SUPPORT_EMAIL      || 'support@thsix.com';
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'THSIX Contact <noreply@thsix.com>';

// Validation limits
const NAME_MAX    = 100;
const EMAIL_MAX   = 254;
const MSG_MIN     = 10;
const MSG_MAX     = 3000;

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// 5 submissions per IP per 10 minutes

const rateLimitMap = new Map();
const RATE_LIMIT   = 5;
const RATE_WINDOW  = 10 * 60 * 1000; // 10 minutes in ms

function isRateLimited(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;
  entry.count += 1;
  return false;
}

// ─── Input helpers ────────────────────────────────────────────────────────────

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Email builders ───────────────────────────────────────────────────────────

function buildEmailHtml(firstName, lastName, email, message) {
  const sf  = escapeHtml(firstName);
  const sl  = escapeHtml(lastName);
  const se  = escapeHtml(email);
  const sm  = escapeHtml(message).replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8">
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f5f5f3;margin:0;padding:32px 0}
  .card{background:#fff;max-width:560px;margin:0 auto;border:1px solid #e9e9e6;padding:40px 48px}
  .brand{font-size:13px;font-weight:800;letter-spacing:.15em;color:#111;text-transform:uppercase;margin-bottom:32px}
  h1{font-size:20px;font-weight:700;color:#111;margin:0 0 28px}
  .lbl{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#777;margin-bottom:4px}
  .val{font-size:15px;color:#111;margin-bottom:24px}
  .msg{background:#f5f5f3;border-left:3px solid #111;padding:16px 20px;font-size:15px;color:#333;line-height:1.7}
  .foot{font-size:12px;color:#999;margin-top:32px;border-top:1px solid #e9e9e6;padding-top:20px}
</style></head>
<body><div class="card">
  <div class="brand">THSIX</div>
  <h1>New Contact Form Submission</h1>
  <div class="lbl">First Name</div><div class="val">${sf}</div>
  <div class="lbl">Last Name</div><div class="val">${sl}</div>
  <div class="lbl">Email</div><div class="val"><a href="mailto:${se}" style="color:#111">${se}</a></div>
  <div class="lbl">Message</div><div class="msg">${sm}</div>
  <div class="foot">Submitted via the Contact Us form on thsix.com.<br>Reply to this email to respond to the customer.</div>
</div></body></html>`;
}

function buildEmailText(firstName, lastName, email, message) {
  return [
    'New Contact Form Submission',
    '============================',
    `First Name : ${firstName}`,
    `Last Name  : ${lastName}`,
    `Email      : ${email}`,
    '',
    'Message:',
    message,
    '',
    '---',
    'Submitted via thsix.com Contact Us form.',
  ].join('\n');
}

// ─── Handler ──────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.thsix.com');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip']        ||
    req.socket?.remoteAddress       ||
    'unknown'
  ).toString().split(',')[0].trim();

  if (isRateLimited(ip)) {
    return res.status(429).json({
      ok: false,
      error: 'Too many requests. Please wait a few minutes before trying again.',
    });
  }

  // Parse body
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Invalid request body.' });
  }

  // Sanitize
  const firstName = sanitize(body.firstName ?? body.first_name ?? '');
  const lastName  = sanitize(body.lastName  ?? body.last_name  ?? '');
  const email     = sanitize(body.email     ?? '').toLowerCase();
  const message   = sanitize(body.message   ?? '');

  // Validate
  const errors = [];
  if (!firstName)                          errors.push('First name is required.');
  if (firstName.length > NAME_MAX)         errors.push(`First name must be at most ${NAME_MAX} characters.`);
  if (!lastName)                           errors.push('Last name is required.');
  if (lastName.length > NAME_MAX)          errors.push(`Last name must be at most ${NAME_MAX} characters.`);
  if (!email)                              errors.push('Email address is required.');
  if (email.length > EMAIL_MAX)            errors.push('Email address is too long.');
  if (email && !isValidEmail(email))       errors.push('Please enter a valid email address.');
  if (!message || message.length < MSG_MIN) errors.push(`Message must be at least ${MSG_MIN} characters.`);
  if (message.length > MSG_MAX)            errors.push(`Message must be at most ${MSG_MAX} characters.`);

  if (errors.length > 0) {
    return res.status(400).json({ ok: false, error: errors[0], errors });
  }

  if (!RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY is not set.');
    return res.status(500).json({
      ok: false,
      error: 'Email service is not configured. Please contact us directly at support@thsix.com.',
    });
  }

  try {
    const resend   = new Resend(RESEND_API_KEY);
    const fullName = `${firstName} ${lastName}`;

    const { error } = await resend.emails.send({
      from:    CONTACT_FROM_EMAIL,
      to:      [SUPPORT_EMAIL],
      replyTo: email,
      subject: `New Contact Form Message from ${fullName}`,
      html:    buildEmailHtml(firstName, lastName, email, message),
      text:    buildEmailText(firstName, lastName, email, message),
    });

    if (error) {
      console.error('[contact] Resend error:', error);
      return res.status(502).json({
        ok: false,
        error: 'We could not send your message right now. Please try again or email us directly at support@thsix.com.',
      });
    }

    return res.status(200).json({ ok: true, message: 'Message sent successfully.' });

  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return res.status(500).json({
      ok: false,
      error: 'An unexpected error occurred. Please try again or email us directly at support@thsix.com.',
    });
  }
};
