// Tests for app/server/lib/admin-token.js (client credentials exchange) with a stubbed fetch.
// Run: npm test
let pass = 0, fail = 0;
const ok = (cond, name) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`); };

let calls = [];
let reply = () => new Response(JSON.stringify({access_token: 'tok-1', scope: 'read_orders', expires_in: 86399}), {status: 200});
globalThis.fetch = async (url, opts = {}) => { calls.push({url: String(url), opts}); return reply(url, opts); };
const origError = console.error; console.error = () => {};

async function suite(label, load, setEnv) {
  // 1. nothing configured
  setEnv({});
  let m = await load(1);
  ok(m.isAdminConfigured() === false, `${label}: unconfigured -> isAdminConfigured false`);
  ok(await m.getAdminToken() === '', `${label}: unconfigured -> empty token`);

  // 2. static token only
  setEnv({SHOPIFY_ADMIN_ACCESS_TOKEN: 'shpat_static'});
  m = await load(2); calls = [];
  ok(m.isAdminConfigured() === true, `${label}: static -> configured`);
  ok(await m.getAdminToken() === 'shpat_static' && calls.length === 0, `${label}: static used, no exchange`);

  // 3. client credentials: exchange, form body, caching, single in-flight request
  setEnv({SHOPIFY_ADMIN_CLIENT_ID: 'cid', SHOPIFY_ADMIN_CLIENT_SECRET: 'csecret', SHOPIFY_ADMIN_ACCESS_TOKEN: 'shpat_static'});
  m = await load(3); calls = [];
  const [a, b] = await Promise.all([m.getAdminToken(), m.getAdminToken()]);
  ok(a === 'tok-1' && b === 'tok-1', `${label}: client credentials token preferred over static`);
  ok(calls.length === 1, `${label}: concurrent callers share one exchange (${calls.length})`);
  const c = calls[0];
  ok(c.url === 'https://19sjnp-gx.myshopify.com/admin/oauth/access_token', `${label}: exchange URL ${c.url}`);
  const body = new URLSearchParams(c.opts.body);
  ok(body.get('grant_type') === 'client_credentials' && body.get('client_id') === 'cid' && body.get('client_secret') === 'csecret', `${label}: form body`);
  ok(c.opts.headers['Content-Type'] === 'application/x-www-form-urlencoded', `${label}: form content type`);
  await m.getAdminToken();
  ok(calls.length === 1, `${label}: cached on later calls`);
  const h = await m.adminAuthHeaders();
  ok(h['X-Shopify-Access-Token'] === 'tok-1' && h['Content-Type'] === 'application/json', `${label}: adminAuthHeaders`);

  // 4. near-expiry token is renewed
  reply = () => new Response(JSON.stringify({access_token: 'short', expires_in: 60}), {status: 200});
  m = await load(4); calls = [];
  await m.getAdminToken();
  reply = () => new Response(JSON.stringify({access_token: 'tok-2', expires_in: 86399}), {status: 200});
  ok(await m.getAdminToken() === 'tok-2' && calls.length === 2, `${label}: token inside refresh margin is renewed`);

  // 5. exchange fails -> static fallback; no static -> throws
  reply = () => new Response('{"error":"invalid_client"}', {status: 400});
  m = await load(5);
  ok(await m.getAdminToken() === 'shpat_static', `${label}: failed exchange falls back to static token`);
  setEnv({SHOPIFY_ADMIN_CLIENT_ID: 'cid', SHOPIFY_ADMIN_CLIENT_SECRET: 'csecret'});
  m = await load(6);
  let threw = false; try { await m.getAdminToken(); } catch { threw = true; }
  ok(threw, `${label}: failed exchange without static token throws`);
  reply = () => new Response(JSON.stringify({access_token: 'tok-1', expires_in: 86399}), {status: 200});
}

// Hydrogen (ESM, env set per request)
const hBase = new URL('../app/server/lib/', import.meta.url).href;
let hEnv = {};
await suite('hydrogen',
  async (n) => {
    const cfg = await import(`${hBase}config.js`);
    cfg.setServerEnv(hEnv);
    return import(`${hBase}admin-token.js?v=${n}`);
  },
  (e) => { hEnv = e; });

console.error = origError;
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
