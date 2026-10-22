// API handler tests: the real handlers with fetch mocked (no live Shiprocket/Resend/Meta calls).
// Run: npm test
import {createHmac} from 'node:crypto';

const SERVER = new URL('../app/server/', import.meta.url);
const imp = (p) => import(new URL(p, SERVER).href);
const {setServerEnv} = await imp('lib/config.js');
const tokenHandler = (await imp('handlers/checkout-token.js')).default;
const orderHandler = (await imp('handlers/webhook-order.js')).default;
const shipmentHandler = (await imp('handlers/webhook-shipment.js')).default;
const syncHandler = (await imp('handlers/catalog-sync.js')).default;
const contactHandler = (await imp('handlers/contact.js')).default;

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

// Builds a real Fetch Request, runs the handler and decodes the Response it returns.
async function call(handler, {method = 'POST', body, headers = {}, query = {}, path = '/api/test'} = {}) {
  const url = new URL(`https://www.thsix.com${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const init = {method, headers: {...headers}};
  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
    if (typeof body !== 'string') init.headers['content-type'] = 'application/json';
  }
  const response = await handler(new Request(url, init));
  if (!(response instanceof Response)) throw new Error(`handler returned ${typeof response}, not a Response`);
  const text = await response.text();
  let parsed;
  try { parsed = text ? JSON.parse(text) : undefined; } catch { parsed = text; }
  return {status: response.status, body: parsed, headers: Object.fromEntries(response.headers)};
}

const calls = [];
function mockFetch(routes) {
  globalThis.fetch = async (url, init = {}) => {
    calls.push({url: String(url), init});
    for (const [match, reply] of routes) {
      if (String(url).includes(match)) {
        const r = typeof reply === 'function' ? reply(String(url), init) : reply;
        return new Response(typeof r.body === 'string' ? r.body : JSON.stringify(r.body), {status: r.status || 200});
      }
    }
    return new Response('{}', {status: 404});
  };
}

const ENV = {
  SHIPROCKET_API_KEY: 'test-key',
  SHIPROCKET_API_SECRET: 'test-secret',
  PUBLIC_STORE_DOMAIN: 'shop.example.myshopify.com',
  PUBLIC_STOREFRONT_API_TOKEN: 'public-token',
  WEBSITE_BASE_URL: 'https://www.thsix.com',
  META_PIXEL_ID: '123',
  META_CAPI_TOKEN: 'capi-token',
  RESEND_API_KEY: 're_test',
  SUPPORT_EMAIL: 'support@thsix.com',
  CONTACT_FROM_EMAIL: 'THSIX Contact <noreply@thsix.com>',
  CRON_SECRET: 'cron-secret',
};

// ── Shiprocket token ───────────────────────────────────────────────────────
setServerEnv(ENV);
mockFetch([
  ['/api/2026-04/graphql.json', {body: {data: {nodes: [{
    __typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/50501821923493', title: 'UK4', availableForSale: true,
    price: {amount: '2999.0'}, image: {url: 'https://cdn.shopify.com/x.png'}, product: {title: 'Samba', featuredImage: null},
  }]}}}],
  ['/api/v1/access-token/checkout', {body: {result: {token: 'sr-token-1', data: {order_id: 'ord1'}}}}],
]);
let r = await call(tokenHandler, {body: {items: [{variant_id: '50501821923493', quantity: 1}, {variant_id: '50501821923493', quantity: 2}], redirect_url: 'https://evil.example/x'}});
const srCall = calls.find((c) => c.url.includes('access-token/checkout'));
const srBody = srCall && JSON.parse(srCall.init.body);
const expectedSig = createHmac('sha256', 'test-secret').update(srCall?.init.body || '').digest('base64');
check('token: 200 with token', r.status === 200 && r.body.token === 'sr-token-1', JSON.stringify(r.body));
check('token: HMAC-SHA256 base64 of exact body', srCall?.init.headers['X-Api-HMAC-SHA256'] === expectedSig);
check('token: X-Api-Key header', srCall?.init.headers['X-Api-Key'] === 'test-key');
check('token: production URL', srCall?.url === 'https://checkout-api.shiprocket.com/api/v1/access-token/checkout', srCall?.url);
check('token: duplicate lines merged, server price used', srBody?.cart_data.items.length === 1 && srBody.cart_data.items[0].quantity === 3 && srBody.cart_data.items[0].catalog_data.price === 2999, JSON.stringify(srBody?.cart_data.items));
check('token: foreign redirect_url replaced', srBody?.redirect_url === 'https://www.thsix.com/checkout/success', srBody?.redirect_url);
r = await call(tokenHandler, {body: {items: [{variant_id: 'abc', quantity: 1}]}});
check('token: invalid variant -> 400', r.status === 400);
r = await call(tokenHandler, {body: {items: [{variant_id: '123', quantity: 99}]}});
check('token: quantity > 20 -> 400', r.status === 400);
r = await call(tokenHandler, {method: 'GET'});
check('token: GET -> 405', r.status === 405);
mockFetch([['/graphql.json', {status: 500, body: 'boom'}]]);
r = await call(tokenHandler, {body: {items: [{variant_id: '50501821923493', quantity: 1}]}});
check('token: Shopify outage -> 502', r.status === 502, JSON.stringify(r.body));
mockFetch([
  ['/graphql.json', {body: {data: {nodes: [{__typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/1', title: 'UK4', availableForSale: true, price: {amount: '1'}, image: null, product: {title: 'S', featuredImage: null}}]}}}],
  ['access-token', {status: 401, body: {message: 'bad'}}],
]);
r = await call(tokenHandler, {body: {items: [{variant_id: '1', quantity: 1}]}});
check('token: Shiprocket 401 -> 502 generic message (no secret leak)', r.status === 502 && !JSON.stringify(r.body).includes('secret'), JSON.stringify(r.body));
setServerEnv({...ENV, SHIPROCKET_API_KEY: ''});
r = await call(tokenHandler, {body: {items: [{variant_id: '1', quantity: 1}]}});
check('token: not configured -> 500 friendly message', r.status === 500 && /not configured/.test(r.body.message));

// ── Order webhook: auth + CAPI ─────────────────────────────────────────────
setServerEnv({...ENV, WEBHOOK_SECRET: 'wh-secret'});
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'abcdef123456'}});
check('order webhook: missing secret -> 401', r.status === 401 && calls.length === 0);
r = await call(orderHandler, {body: {order_id: 'abcdef123456'}, query: {token: 'wrong'}});
check('order webhook: wrong secret -> 401', r.status === 401);
mockFetch([
  ['custom-platform-order/details', {body: {ok: true, result: {
    order_id: 'abcdef123456', status: 'SUCCESS', payment_type: 'PREPAID', payment_status: 'SUCCESS', total_amount_payable: 2999,
    email: 'Buyer@Example.com', phone: '+91 98765 43210',
    cart_data: {items: [{variant_id: '50501821923493', quantity: 1, price: 2999}]},
    shipping_address: {first_name: 'A', last_name: 'B', line1: 'x', city: 'Pune', state: 'MH', pincode: '411001', phone: '9876543210'},
  }}}],
  ['graph.facebook.com', {body: {events_received: 1}}],
]);
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'abcdef123456'}, query: {token: 'wh-secret'}});
const capi = calls.find((c) => c.url.includes('graph.facebook.com'));
const capiBody = capi && JSON.parse(capi.init.body);
const ev = capiBody?.data?.[0];
const {createHash} = await import('node:crypto');
const sha = (s) => createHash('sha256').update(s).digest('hex');
check('order webhook: correct secret accepted (200)', r.status === 200, JSON.stringify(r.body));
check('order webhook: Shiprocket order verified via signed API', calls.some((c) => c.url.includes('custom-platform-order/details') && c.init.headers['X-Api-HMAC-SHA256']));
check('CAPI: sent without Admin token configured', Boolean(capi), capi?.url.replace(/access_token=[^&]+/, 'access_token=***'));
check('CAPI: Purchase, event_id = order id (dedup with browser)', ev?.event_name === 'Purchase' && ev?.event_id === 'abcdef123456' && ev?.action_source === 'website');
check('CAPI: value/currency/contents', ev?.custom_data.value === 2999 && ev?.custom_data.currency === 'INR' && ev?.custom_data.contents[0].id === '50501821923493');
check('CAPI: email/phone SHA-256 hashed, normalised', ev?.user_data.em === await sha('buyer@example.com') && ev?.user_data.ph === await sha('9876543210'));
check('CAPI: Graph API version current (v23.0)', capi?.url.includes('/v23.0/'));
check('order webhook: no Admin token -> skips Shopify order', r.body?.shopify === 'not configured');

// Unauthenticated mode (no WEBHOOK_SECRET): the webhooks stay open
setServerEnv(ENV);
r = await call(orderHandler, {body: {}});
check('order webhook (no secret set): empty body -> 400', r.status === 400);
r = await call(orderHandler, {method: 'GET'});
check('order webhook: GET -> 405', r.status === 405);

// Shipment webhook auth via X-Api-Key (Shiprocket Shipping "Token" field)
setServerEnv({...ENV, WEBHOOK_SECRET: 'wh-secret', SHOPIFY_ADMIN_ACCESS_TOKEN: ''});
r = await call(shipmentHandler, {body: {awb: '1'}});
check('shipment webhook: missing token -> 401', r.status === 401);
r = await call(shipmentHandler, {body: {awb: '1'}, headers: {'x-api-key': 'wh-secret'}});
check('shipment webhook: X-Api-Key token accepted', r.status === 200, JSON.stringify(r.body));

// ── Catalog sync auth ──────────────────────────────────────────────────────
setServerEnv(ENV);
r = await call(syncHandler, {method: 'GET', headers: {}});
check('catalog sync: no bearer -> 401', r.status === 401);
r = await call(syncHandler, {method: 'GET', headers: {authorization: 'Bearer nope'}});
check('catalog sync: wrong bearer -> 401', r.status === 401);
setServerEnv({...ENV, CRON_SECRET: ''});
r = await call(syncHandler, {method: 'GET', headers: {authorization: 'Bearer '}});
check('catalog sync: CRON_SECRET unset -> always 401', r.status === 401);

// ── Contact (Resend) ───────────────────────────────────────────────────────
setServerEnv(ENV);
mockFetch([['api.resend.com/emails', {body: {id: 'email_1'}}]]);
calls.length = 0;
r = await call(contactHandler, {body: {firstName: 'Asha', lastName: 'K', email: 'Asha@Example.com', message: 'Hello <script>x</script> there\nsecond line'}, headers: {'oxygen-buyer-ip': '1.2.3.4'}});
const resend = calls.find((c) => c.url.includes('resend'));
const rb = resend && JSON.parse(resend.init.body);
check('contact: 200 on Resend success', r.status === 200 && r.body.ok === true);
check('contact: server-side Bearer key, not in response', resend?.init.headers.Authorization === 'Bearer re_test' && !JSON.stringify(r.body).includes('re_test'));
check('contact: from/to/reply_to', rb?.from === 'THSIX Contact <noreply@thsix.com>' && rb?.to[0] === 'support@thsix.com' && rb?.reply_to === 'asha@example.com');
check('contact: HTML escaped + line breaks kept', !rb?.html.includes('<script>') && rb?.html.includes('there<br>second line'));
mockFetch([['api.resend.com/emails', {status: 422, body: {message: 'invalid from'}}]]);
r = await call(contactHandler, {body: {firstName: 'A', lastName: 'B', email: 'a@b.co', message: 'long enough msg'}, headers: {'oxygen-buyer-ip': '5.6.7.8'}});
check('contact: Resend error -> 502 friendly', r.status === 502);
r = await call(contactHandler, {body: {firstName: '', lastName: 'B', email: 'bad', message: 'x'}, headers: {'oxygen-buyer-ip': '9.9.9.9'}});
check('contact: validation -> 400', r.status === 400 && r.body.errors.length >= 2);
for (let i = 0; i < 6; i++) r = await call(contactHandler, {body: {}, headers: {'oxygen-buyer-ip': '7.7.7.7'}});
check('contact: rate limit -> 429 after 5', r.status === 429);
setServerEnv({...ENV, RESEND_API_KEY: ''});
r = await call(contactHandler, {body: {firstName: 'A', lastName: 'B', email: 'a@b.co', message: 'long enough msg'}, headers: {'oxygen-buyer-ip': '8.8.8.8'}});
check('contact: no key -> 500 with support email hint', r.status === 500 && /support@thsix.com/.test(r.body.error));

// ── Fetch-API plumbing (lib/http.js, catalogue routes, preflight) ─────────────
const {handleApi, readBody, clientIp} = await imp('lib/http.js');
const healthHandler = (await imp('handlers/checkout-health.js')).default;
const productsHandler = (await imp('handlers/catalog-products.js')).default;
const byCollectionHandler = (await imp('handlers/catalog-products-by-collection.js')).default;

let viaApi = await handleApi(() => { throw new Error('boom'); }, new Request('https://x/api/t'), ENV);
check('handleApi: thrown error -> JSON 500', viaApi.status === 500 && (await viaApi.json()).message === 'Internal server error');
setServerEnv({});
viaApi = await handleApi(healthHandler, new Request('https://x/api/checkout/health'), {...ENV, SHIPROCKET_API_KEY: ''});
const health = await viaApi.json();
check('handleApi: loads env before the handler runs', health.apiKeySet === false && health.apiSecretSet === true && health.metaCapiConfigured === true);
check('health: no-store + CORS + JSON content type', viaApi.headers.get('cache-control') === 'no-store' && viaApi.headers.get('access-control-allow-origin') === '*' && viaApi.headers.get('content-type').startsWith('application/json'));

setServerEnv(ENV);
r = await call(tokenHandler, {method: 'OPTIONS'});
check('token: OPTIONS preflight -> 200, empty body, CORS', r.status === 200 && r.body === undefined && r.headers['access-control-allow-methods'].includes('POST'));
r = await call(contactHandler, {method: 'OPTIONS'});
check('contact: CORS limited to www.thsix.com', r.status === 200 && r.headers['access-control-allow-origin'] === 'https://www.thsix.com' && r.headers.vary === 'Origin');
r = await call(orderHandler, {body: 'not json', headers: {'content-type': 'text/plain'}});
check('order webhook: non-JSON body -> 400 (no crash)', r.status === 400);

mockFetch([['/graphql.json', {body: {data: {products: {edges: [], pageInfo: {hasNextPage: false}}}}}]]);
r = await call(productsHandler, {method: 'GET', query: {page: '0'}});
check('catalog: page=0 -> 400 VALIDATION_ERROR', r.status === 400 && r.body.errorCode === 'VALIDATION_ERROR');
r = await call(productsHandler, {method: 'POST'});
check('catalog: POST -> 405', r.status === 405);
r = await call(byCollectionHandler, {method: 'GET', query: {collection_id: 'abc'}});
check('catalog by collection: non-numeric id -> 400', r.status === 400 && /collection_id/.test(r.body.message));
r = await call(productsHandler, {method: 'OPTIONS'});
check('catalog: OPTIONS -> 200 with GET-only CORS', r.status === 200 && r.headers['access-control-allow-methods'] === 'GET, OPTIONS');

check('readBody: JSON parsed, text kept, empty JSON -> {}',
  (await readBody(new Request('https://x', {method: 'POST', headers: {'content-type': 'application/json'}, body: '{"a":1}'}))).a === 1
  && (await readBody(new Request('https://x', {method: 'POST', body: 'a=b'}))) === 'a=b'
  && JSON.stringify(await readBody(new Request('https://x', {method: 'POST', headers: {'content-type': 'application/json'}, body: ''}))) === '{}');
check('clientIp: oxygen-buyer-ip first, x-forwarded-for first hop',
  clientIp(new Request('https://x', {headers: {'oxygen-buyer-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2'}})) === '1.1.1.1'
  && clientIp(new Request('https://x', {headers: {'x-forwarded-for': '3.3.3.3, 4.4.4.4'}})) === '3.3.3.3');

// ── Shopify order creation: webhook, success-page confirm, scheduled reconcile ──
const confirmHandler = (await imp('handlers/order-confirm.js')).default;
const reconcileHandler = (await imp('handlers/order-reconcile.js')).default;
const ADMIN_ENV = {...ENV, SHOPIFY_ADMIN_ACCESS_TOKEN: 'shpat_test'};
const srOrder = (id, extra = {}) => ({
  order_id: id, status: 'SUCCESS', payment_type: 'COD', payment_status: 'PENDING', total_amount_payable: 2999,
  phone: '9876543210', cart_data: {items: [{variant_id: '50501821923493', quantity: 1}]},
  shipping_address: {first_name: 'A', last_name: 'B', line1: 'x', city: 'Pune', pincode: '411001', phone: '9876543210'},
  ...extra,
});
// inShopify: tags whose order already exists in Shopify
function mockStore({details, list = [], inShopify = []}) {
  mockFetch([
    ['custom-platform-order/details/list', (url, init) => ({body: {result: JSON.parse(init.body).page === 0 ? list : []}})],
    ['custom-platform-order/details', {body: {ok: true, result: details}}],
    ['graph.facebook.com', {body: {events_received: 1}}],
    ['customers/search.json', {body: {customers: []}}],
    ['/admin/api/2026-10/orders.json', {status: 201, body: {order: {name: '#1001'}}}],
    ['/admin/api/2026-10/graphql.json', (url, init) => {
      const q = JSON.parse(init.body).variables?.q || '';
      const hit = inShopify.find((tag) => q.includes(tag));
      return {body: {data: {orders: {edges: hit ? [{node: {id: 'gid://shopify/Order/9', name: '#0900'}}] : []}, customers: {edges: []}}}};
    }],
    ['/api/2026-04/graphql.json', {body: {data: {nodes: [{__typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/50501821923493', title: 'UK4', availableForSale: true, price: {amount: '2999.0'}, image: null, product: {title: 'Samba', featuredImage: null}}]}}}],
  ]);
}
const shopifyCreates = () => calls.filter((c) => c.url.includes('/orders.json') && c.init.method === 'POST');

setServerEnv(ADMIN_ENV);
mockStore({details: srOrder('codorder1234')});
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'codorder1234'}});
const created = shopifyCreates()[0];
const createdOrder = created && JSON.parse(created.init.body).order;
check('order webhook: COD order created in Shopify', r.status === 200 && r.body.shopify_order === '#1001', JSON.stringify(r.body));
check('order webhook: Shopify order tagged sr-<id>, cod, pending', createdOrder?.tags.includes('sr-codorder1234') && createdOrder.tags.includes('cod') && createdOrder.financial_status === 'pending');

mockStore({details: srOrder('codorder1234'), inShopify: ['sr-codorder1234']});
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'codorder1234'}});
check('order webhook: repeat delivery creates no duplicate', r.status === 200 && shopifyCreates().length === 0 && r.body.shopify_order === '#0900', JSON.stringify(r.body));

r = await call(confirmHandler, {method: 'GET'});
check('confirm: GET -> 405', r.status === 405);
r = await call(confirmHandler, {body: {order_id: 'x'}});
check('confirm: invalid order_id -> 400', r.status === 400);
mockStore({details: srOrder('prepaid12345', {payment_type: 'PREPAID', payment_status: 'SUCCESS'})});
calls.length = 0;
r = await call(confirmHandler, {body: {order_id: 'prepaid12345', total_amount_payable: 1}});
const paidOrder = shopifyCreates()[0] && JSON.parse(shopifyCreates()[0].init.body).order;
check('confirm: paid prepaid order created, from Shiprocket data (not the browser body)', r.status === 200 && r.body.ok === true && paidOrder?.financial_status === 'paid' && paidOrder.transactions[0].amount === '2999.00', JSON.stringify(r.body));
check('confirm: no order details echoed to the browser', Object.keys(r.body).join() === 'ok');
mockStore({details: srOrder('unpaid123456', {payment_type: 'PREPAID', payment_status: 'PENDING'})});
calls.length = 0;
r = await call(confirmHandler, {body: {order_id: 'unpaid123456'}});
check('confirm: prepaid order with unpaid payment is not created', r.status === 200 && shopifyCreates().length === 0);
mockFetch([['custom-platform-order/details', {status: 400, body: {ok: false, message: 'Order not found'}}]]);
r = await call(confirmHandler, {body: {order_id: 'forged123456'}});
check('confirm: unknown order -> 500 (retry later), nothing created', r.status === 500 && shopifyCreates().length === 0);

r = await call(reconcileHandler, {method: 'GET'});
check('reconcile: no cron secret -> 401', r.status === 401);
mockStore({list: [
  srOrder('missing12345'),
  srOrder('already12345'),
  srOrder('missing12345'),
  srOrder('unpaidlist12', {payment_type: 'PREPAID', payment_status: 'FAILED'}),
], inShopify: ['sr-already12345']});
calls.length = 0;
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {hours: '72'}});
const listCall = calls.find((c) => c.url.includes('details/list'));
const listBody = listCall && JSON.parse(listCall.init.body);
const windowHours = listBody && (new Date(listBody.endDate) - new Date(listBody.startDate)) / 3600000;
check('reconcile: 200, checks each order once', r.status === 200 && r.body.checked === 3, JSON.stringify(r.body).slice(0, 300));
check('reconcile: creates only the missing order', shopifyCreates().length === 1 && JSON.parse(shopifyCreates()[0].init.body).order.tags.includes('sr-missing12345'));
check('reconcile: hours=72 -> 72h Shiprocket window', windowHours === 72 && r.body.hours === 72);
check('reconcile: lists Shiprocket orders via the signed API', Boolean(listCall?.init.headers['X-Api-HMAC-SHA256']));
mockStore({list: []});
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {hours: 'abc'}});
check('reconcile: bad hours -> default 3h window', r.status === 200 && r.body.hours === 3);
// Other plausible response formats: nested under result.orders, pages starting at 1
mockStore({inShopify: []});
const storeRoutes = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  if (String(url).includes('details/list')) {
    calls.push({url: String(url), init});
    const page = JSON.parse(init.body).page;
    const orders = page === 1 ? [srOrder('nested123456')] : [];
    return new Response(JSON.stringify({success: true, data: {orders, total: 1}}), {status: 200});
  }
  return storeRoutes(url, init);
};
calls.length = 0;
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}});
check('reconcile: finds orders nested under data.orders with 1-based pages', r.status === 200 && r.body.checked === 1 && shopifyCreates().length === 1, JSON.stringify(r.body).slice(0, 200));
globalThis.fetch = async (url, init = {}) => String(url).includes('details/list')
  ? new Response(JSON.stringify({ok: true, result: {rows: [], count: 0, msg: 'x'}}), {status: 200})
  : storeRoutes(url, init);
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}});
check('reconcile: nothing found -> response shape reported, no values', r.body.shiprocket_response_shape?.result?.rows === 'array(0)' && r.body.shiprocket_response_shape.result.msg === 'string' && !JSON.stringify(r.body).includes('"x"'), JSON.stringify(r.body.shiprocket_response_shape));

mockStore({details: srOrder('single123456')});
calls.length = 0;
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {order_id: 'single123456'}});
check('reconcile: ?order_id recovers one order via Order Details', r.status === 200 && r.body.shopify_order === '#1001' && !calls.some((c) => c.url.includes('details/list')), JSON.stringify(r.body));
mockStore({details: srOrder('pending12345', {status: 'INITIATED', payment_type: 'PREPAID', payment_status: 'Pending'})});
calls.length = 0;
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {order_id: 'pending12345'}});
check('reconcile: unpaid prepaid order skipped without force', r.status === 200 && shopifyCreates().length === 0 && /Pending/.test(r.body.skipped));
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {order_id: 'pending12345', force: '1'}});
const forced = shopifyCreates()[0] && JSON.parse(shopifyCreates()[0].init.body).order;
check('reconcile: force=1 creates it unpaid, tagged prepaid-unpaid, no transaction', r.body.shopify_order === '#1001' && forced?.financial_status === 'pending' && !forced.transactions && forced.tags.includes('prepaid-unpaid'), JSON.stringify(forced?.tags));
mockStore({list: [srOrder('listpend1234', {payment_type: 'PREPAID', payment_status: 'Pending'})]});
calls.length = 0;
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {force: '1'}});
check('reconcile: force is ignored for the hours scan', shopifyCreates().length === 0);
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {order_id: 'bad id!'}});
check('reconcile: invalid order_id -> 400', r.status === 400);

mockFetch([['details/list', {status: 401, body: {message: 'bad'}}]]);
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}});
check('reconcile: Shiprocket failure -> 502 (workflow run fails visibly)', r.status === 502);
setServerEnv(ENV);
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}});
check('reconcile: no Admin API access -> 500', r.status === 500);

console.log(`\n${pass}/${pass + fail} server checks passed`);
process.exit(fail ? 1 : 0);
