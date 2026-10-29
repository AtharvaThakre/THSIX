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
const {createHash} = await import('node:crypto');
const sha = (s) => createHash('sha256').update(s).digest('hex');
check('order webhook: correct secret accepted (200)', r.status === 200, JSON.stringify(r.body));
check('order webhook: Shiprocket order verified via signed API', calls.some((c) => c.url.includes('custom-platform-order/details') && c.init.headers['X-Api-HMAC-SHA256']));
check('order webhook: no Admin token -> no Shopify order and no Purchase sent to Meta', r.body?.shopify === 'not configured' && !capi && r.body.placed !== true);

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
const lockStore = new Map();
let lockDigest = 0;
let recentOrders = [];
const taggedOrders = [];
const manualPayments = [];
let shopifyOrderState = null;
function mockStore({details, list = [], inShopify = []}) {
  lockStore.clear();
  recentOrders = [];
  mockFetch([
    ['custom-platform-order/details/list', (url, init) => ({body: {result: JSON.parse(init.body).page === 0 ? list : []}})],
    ['custom-platform-order/details', {body: {ok: true, result: details}}],
    ['graph.facebook.com', {body: {events_received: 1}}],
    ['customers/search.json', {body: {customers: []}}],
    ['/admin/api/2026-10/orders.json', {status: 201, body: {order: {name: '#1001'}}}],
    ['/admin/api/2026-10/graphql.json', (url, init) => {
      const {query, variables = {}} = JSON.parse(init.body);
      // Order lock: shop metafields, created only if absent when compareDigest is null
      if (query.includes('shop { id }')) return {body: {data: {shop: {id: 'gid://shopify/Shop/1'}}}};
      if (query.includes('metafieldsSet')) {
        const m = variables.m[0];
        const cur = lockStore.get(m.key);
        if ('compareDigest' in m && (m.compareDigest === null ? cur : cur?.digest !== m.compareDigest)) {
          return {body: {data: {metafieldsSet: {metafields: null, userErrors: [{field: ['metafields'], code: 'STALE_OBJECT', message: 'The resource has been updated since it was loaded.'}]}}}};
        }
        lockStore.set(m.key, {value: m.value, digest: `d${++lockDigest}`});
        return {body: {data: {metafieldsSet: {metafields: [{id: 'm'}], userErrors: []}}}};
      }
      if (query.includes('metafieldsDelete')) {
        lockStore.delete(variables.m[0].key);
        return {body: {data: {metafieldsDelete: {userErrors: []}}}};
      }
      if (query.includes('metafield(namespace')) {
        const cur = lockStore.get(variables.key);
        return {body: {data: {shop: {metafield: cur ? {value: cur.value, compareDigest: cur.digest} : null}}}};
      }
      if (query.includes('order(id: $id)') && !query.includes('orderCreateManualPayment')) {
        return {body: {data: {order: shopifyOrderState}}};
      }
      if (query.includes('orderCreateManualPayment')) {
        manualPayments.push(variables.amount);
        return {body: {data: {orderCreateManualPayment: {order: {displayFinancialStatus: 'PARTIALLY_PAID', totalReceivedSet: {shopMoney: {amount: variables.amount.amount}}}, userErrors: []}}}};
      }
      if (query.includes('tagsAdd')) {
        taggedOrders.push(...variables.tags);
        return {body: {data: {tagsAdd: {userErrors: []}}}};
      }
      if ((variables.q || '').startsWith('name:')) {
        return {body: {data: {orders: {nodes: [{id: 'gid://shopify/Order/77'}]}}}};
      }
      if (query.includes('sortKey: CREATED_AT')) {
        return {body: {data: {orders: {nodes: recentOrders}}}};
      }
      const q = variables.q || '';
      const hit = inShopify.find((tag) => q.includes(tag));
      return {body: {data: {orders: {edges: hit ? [{node: {id: 'gid://shopify/Order/9', name: '#0900'}}] : []}, customers: {edges: []}}}};
    }],
    ['/api/2026-04/graphql.json', {body: {data: {nodes: [{__typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/50501821923493', title: 'UK4', availableForSale: true, price: {amount: '2999.0'}, image: null, product: {title: 'Samba', featuredImage: null}}]}}}],
  ]);
}
const shopifyCreates = () => calls.filter((c) => c.url.includes('/orders.json') && c.init.method === 'POST');

setServerEnv(ADMIN_ENV);
mockStore({details: srOrder('codorder1234', {email: 'Buyer@Example.com'})});
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'codorder1234'}});
const created = shopifyCreates()[0];
const createdOrder = created && JSON.parse(created.init.body).order;
check('order webhook: COD order created in Shopify', r.status === 200 && r.body.shopify_order === '#1001', JSON.stringify(r.body));
check('order webhook: Shopify order tagged sr-<id>, cod, pending', createdOrder?.tags.includes('sr-codorder1234') && createdOrder.tags.includes('cod') && createdOrder.financial_status === 'pending');
{
  const capi2 = calls.find((c) => c.url.includes('graph.facebook.com'));
  const ev2 = capi2 && JSON.parse(capi2.init.body).data[0];
  check('CAPI: sent once the Shopify order exists', Boolean(capi2), capi2?.url.replace(/access_token=[^&]+/, 'access_token=***'));
  check('CAPI: Purchase, event_id = order id (dedup with browser)', ev2?.event_name === 'Purchase' && ev2?.event_id === '#1001' && ev2?.action_source === 'website');
  check('CAPI: value/currency/contents', ev2?.custom_data.value === 2999 && ev2?.custom_data.currency === 'INR' && ev2?.custom_data.contents[0].id === '50501821923493');
  check('CAPI: email/phone SHA-256 hashed, normalised', ev2?.user_data.em === await sha('buyer@example.com') && ev2?.user_data.ph === await sha('9876543210'));
  check('CAPI: Graph API version current (v23.0)', capi2?.url.includes('/v23.0/'));
}

mockStore({details: srOrder('codorder1234'), inShopify: ['sr-codorder1234']});
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'codorder1234'}});
check('order webhook: repeat delivery creates no duplicate', r.status === 200 && shopifyCreates().length === 0 && r.body.shopify_order === '#0900', JSON.stringify(r.body));

// ── Duplicate protection (Shopify search lags behind new orders: inShopify stays empty) ──
const withSlowCreate = (ms, {fail} = {}) => {
  const inner = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).includes('/orders.json') && init.method === 'POST') {
      calls.push({url: String(url), init});
      await new Promise((res) => setTimeout(res, ms));
      if (fail === 'lost') throw new Error('network connection lost');
      if (fail === 'reject') return new Response('{"errors":"line_items invalid"}', {status: 422});
      return new Response(JSON.stringify({order: {name: '#1001'}}), {status: 201});
    }
    return inner(url, init);
  };
};
setServerEnv(ADMIN_ENV);
mockStore({details: srOrder('dupe12345678')});
withSlowCreate(300);
calls.length = 0;
const [a, b] = await Promise.all([
  call(orderHandler, {body: {order_id: 'dupe12345678'}}),
  call(confirmHandler, {body: {order_id: 'dupe12345678'}}),
]);
check('duplicates: webhook + success page at the same moment -> one Shopify order', shopifyCreates().length === 1 && a.status === 200 && [200, 503].includes(b.status), `${shopifyCreates().length} creates; ${JSON.stringify(a.body)}`);
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'dupe12345678'}});
check('duplicates: later redelivery (search still empty) -> no new order, same name', shopifyCreates().length === 0 && r.body.shopify_order === '#1001', JSON.stringify(r.body));
calls.length = 0;
mockStore({details: srOrder('triple123456')});
withSlowCreate(300);
calls.length = 0;
const triple = await Promise.all([1, 2, 3].map(() => call(orderHandler, {body: {order_id: 'triple123456'}})));
check('duplicates: three simultaneous deliveries -> one order', shopifyCreates().length === 1 && triple.every((t) => t.status === 200));

mockStore({details: srOrder('recent123456')});
recentOrders = [{name: '#1040', tags: ['shiprocket', 'sr-recent123456', 'cod']}];
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'recent123456'}});
check('duplicates: found among newest orders even when search misses it', shopifyCreates().length === 0 && r.body.shopify_order === '#1040', JSON.stringify(r.body));

mockStore({details: srOrder('lost12345678')});
withSlowCreate(10, {fail: 'lost'});
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'lost12345678'}});
check('duplicates: lost Shopify response -> the retry does not create a second copy', shopifyCreates().length === 1 && r.status === 200 && r.body.in_progress === true, JSON.stringify(r.body));

mockStore({details: srOrder('reject123456')});
withSlowCreate(10, {fail: 'reject'});
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'reject123456'}});
check('duplicates: Shopify rejects -> claim released, retried, 500 for Shiprocket to retry', shopifyCreates().length === 2 && r.status === 500 && !lockStore.has('sr-reject123456'));

mockStore({details: srOrder('stale1234567')});
lockStore.set('sr-stale1234567', {value: `claimed:${Date.now() - 11 * 60 * 1000}`, digest: 'old'});
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'stale1234567'}});
check('duplicates: claim abandoned >10 min ago is taken over', shopifyCreates().length === 1 && r.body.shopify_order === '#1001' && lockStore.get('sr-stale1234567').value.startsWith('#1001|'));

mockStore({details: srOrder('nolock123456')});
const lockless = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => (String(url).includes('/admin/api/') && String(init.body || '').includes('shop { id }'))
  ? new Response('{"errors":[{"message":"Access denied"}]}', {status: 200})
  : lockless(url, init);
calls.length = 0;
r = await call(orderHandler, {body: {order_id: 'nolock123456'}});
check('duplicates: lock unavailable -> order still created (falls back to the checks)', shopifyCreates().length === 1 && r.body.shopify_order === '#1001', JSON.stringify(r.body));

// ── Shiprocket recording one prepaid payment as two orders (ids a second apart) ──
// Real case: #1040/#1041 from 6adca615a4c2260345906f2d and 6adca6146209f04ade2b5c7d
const TWIN_A = '6adca6146209f04ade2b5c7d';
const TWIN_B = '6adca615a4c2260345906f2d';
const LATER = (0x6adca614 + 10 * 60).toString(16) + '6209f04ade2b5c7e'; // same buyer, 10 min later
const paidTwin = (id) => srOrder(id, {payment_type: 'PREPAID', payment_status: 'SUCCESS'});
const twinStore = (opts = {}) => {
  mockStore({details: paidTwin(TWIN_A), ...opts});
  const inner = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).includes('custom-platform-order/details') && !String(url).includes('/list')) {
      calls.push({url: String(url), init});
      const id = JSON.parse(init.body).order_id;
      return new Response(JSON.stringify({ok: true, result: paidTwin(id)}), {status: 200});
    }
    return inner(url, init);
  };
  withSlowCreate(300);
};
setServerEnv(ADMIN_ENV);
twinStore();
calls.length = 0;
const twins = await Promise.all([
  call(orderHandler, {body: {order_id: TWIN_A}}),
  call(confirmHandler, {body: {order_id: TWIN_B}}),
]);
const twinCreatedTags = shopifyCreates()[0] ? JSON.parse(shopifyCreates()[0].init.body).order.tags : '';
check('twin ids: webhook (id A) + success page (id B) at once -> one Shopify order', shopifyCreates().length === 1, `${shopifyCreates().length} creates; ${twins.map((t) => t.status).join(',')}`);

calls.length = 0;
taggedOrders.length = 0;
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {order_id: TWIN_B}});
check('twin ids: id B processed later (reconcile) -> same order, no new one, order tagged sr-B', shopifyCreates().length === 0 && r.body.shopify_order === '#1001' && (taggedOrders.includes(`sr-${TWIN_B}`) || twinCreatedTags.includes(`sr-${TWIN_B}`)), JSON.stringify(r.body));

twinStore();
calls.length = 0;
await call(orderHandler, {body: {order_id: TWIN_A}});
await call(orderHandler, {body: {order_id: LATER}});
check('twin ids: same customer + items 10 min later is a real new order -> created', shopifyCreates().length === 2);

twinStore();
recentOrders = [{name: '#1041', tags: ['shiprocket', `sr-${TWIN_A}`], createdAt: new Date(0x6adca614 * 1000 + 3000).toISOString(),
  phone: '+919876543210', email: null, shippingAddress: {phone: '+919876543210'},
  lineItems: {nodes: [{quantity: 1, variant: {legacyResourceId: '50501821923493'}}]}}];
lockStore.clear();
const lockless2 = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => (String(url).includes('/admin/api/') && String(init.body || '').includes('shop { id }'))
  ? new Response('{"errors":[{"message":"Access denied"}]}', {status: 200})
  : lockless2(url, init);
calls.length = 0;
r = await call(orderHandler, {body: {order_id: TWIN_B}});
check('twin ids: lock unavailable -> twin still found among newest orders', shopifyCreates().length === 0 && r.body.shopify_order === '#1041', JSON.stringify(r.body));

// ── Partial COD (₹199 advance online, balance in cash) ──
const {paymentBreakdown} = await imp('lib/partial-cod.js');
check('partial COD: advance field', JSON.stringify(paymentBreakdown({prepaid_amount: 199}, 2999)) === JSON.stringify({partial: true, paid: 199, due: 2800, source: 'advance amount'}));
check('partial COD: COD amount to collect', paymentBreakdown({cod_amount: '2600'}, 2799).paid === 199);
check('partial COD: online payment amount below total', paymentBreakdown({payment_type: 'COD', paymentDetails: {amount: 199, transactionId: 't'}}, 2999).paid === 199);
check('partial COD: 5% prepaid discount is not partial', paymentBreakdown({payment_type: 'PREPAID', paymentDetails: {amount: 2849}}, 2999).partial === false);
check('partial COD: flagged partial with a large advance', paymentBreakdown({payment_type: 'PARTIAL_COD', advance_amount: 1600}, 2999).paid === 1600);
check('partial COD: plain COD and full prepaid are not partial', !paymentBreakdown({payment_type: 'COD', cod_amount: 2999}, 2999).partial && !paymentBreakdown({payment_type: 'PREPAID', paymentDetails: {amount: 2999}}, 2999).partial);

const partialOrder = (id, extra = {}) => srOrder(id, {payment_type: 'PARTIAL_COD', payment_status: 'PENDING', prepaid_amount: 199, email: 'x@y.com', ...extra});
setServerEnv(ADMIN_ENV);
mockStore({details: partialOrder('partial12345')});
calls.length = 0;
r = await call(confirmHandler, {body: {order_id: 'partial12345'}});
const pOrder = shopifyCreates()[0] && JSON.parse(shopifyCreates()[0].init.body).order;
check('partial COD: created (not skipped as unpaid prepaid) from the success page', r.status === 200 && Boolean(pOrder), JSON.stringify(r.body));
check('partial COD: Shopify order partially paid, advance recorded, never "paid"', pOrder?.financial_status === 'partially_paid' && pOrder.transactions.length === 1 && pOrder.transactions[0].amount === '199.00', JSON.stringify(pOrder?.transactions));
check('partial COD: tagged partial-cod, balance noted', pOrder?.tags.includes('partial-cod') && pOrder.note_attributes.some((a) => a.name === 'cod_balance_to_collect' && a.value === '2800.00'));
mockStore({details: partialOrder('partpaid1234', {payment_status: 'SUCCESS'})});
calls.length = 0;
await call(orderHandler, {body: {order_id: 'partpaid1234'}});
const pOrder2 = shopifyCreates()[0] && JSON.parse(shopifyCreates()[0].init.body).order;
check('partial COD: advance paid successfully still not marked fully paid (#1043 case)', pOrder2?.financial_status === 'partially_paid' && pOrder2.transactions[0].amount === '199.00');

// Shiprocket charged ₹2,799 (₹199 now + ₹2,600 on delivery) for a ₹2,999 item: offer not itemised
mockStore({details: partialOrder('offer1234567', {total_amount_payable: 2799})});
calls.length = 0;
await call(orderHandler, {body: {order_id: 'offer1234567'}});
const offerOrder = shopifyCreates()[0] && JSON.parse(shopifyCreates()[0].init.body).order;
check('partial COD: Shiprocket offer becomes a ₹200 discount, so ₹2,600 shows as due', offerOrder?.discount_codes?.[0]?.amount === '200.00' && offerOrder.transactions[0].amount === '199.00' && offerOrder.note_attributes.some((a) => a.name === 'cod_balance_to_collect' && a.value === '2600.00'), JSON.stringify(offerOrder?.discount_codes));
mockStore({details: srOrder('fullprice123')});
calls.length = 0;
await call(orderHandler, {body: {order_id: 'fullprice123'}});
check('no offer -> no discount added', !JSON.parse(shopifyCreates()[0].init.body).order.discount_codes);

mockStore({details: srOrder('hookpay12345')});
calls.length = 0;
await call(orderHandler, {body: {order_id: 'hookpay12345', payment: {mode: 'PARTIAL', advance_amount: 199}, customer: {name: 'Secret', phone: '9999999999'}}});
{
  const attrs = JSON.parse(shopifyCreates()[0].init.body).order.note_attributes;
  const hook = attrs.find((a) => a.name === 'shiprocket_webhook_payment');
  const hookOrder = JSON.parse(shopifyCreates()[0].init.body).order;
  check('advance only in the webhook (record says plain COD) -> still recorded as partial', hookOrder.financial_status === 'partially_paid' && hookOrder.transactions[0].amount === '199.00');
  check('webhook payment fields kept on the order, no customer data', hook && hook.value.includes('"payment.advance_amount":199') && !/Secret|9999999999/.test(hook.value), hook && hook.value);
}

const cronGet = (query) => call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query});
mockStore({details: partialOrder('partial12345', {shipping_address: {name: 'Secret Person', phone: '9999999999', line1: '1 Hidden St', city: 'Pune'}})});
calls.length = 0;
r = await cronGet({order_id: 'partial12345', inspect: '1'});
const inspected = JSON.stringify(r.body);
check('inspect: shows payment fields and the detected split', r.status === 200 && r.body.shiprocket_payment_fields.prepaid_amount === 199 && r.body.detected.partial_cod.due === 2800, inspected.slice(0, 300));
check('inspect: no customer name/phone/address/email', !/Secret|9999999999|Hidden|x@y\.com/.test(inspected));
check('inspect: creates nothing', shopifyCreates().length === 0);

mockStore({details: partialOrder('partial12345'), inShopify: ['sr-partial12345']});
shopifyOrderState = {name: '#1044', displayFinancialStatus: 'PENDING', totalReceivedSet: {shopMoney: {amount: '0.0', currencyCode: 'INR'}}, totalPriceSet: {shopMoney: {amount: '2999.0'}}};
manualPayments.length = 0;
r = await cronGet({order_id: 'partial12345', fix_partial: '1'});
check('fix partial: preview changes nothing', r.status === 200 && r.body.applied === false && manualPayments.length === 0 && /would record ₹199/.test(r.body.result), JSON.stringify(r.body));
r = await cronGet({order_id: 'partial12345', fix_partial: '1', apply: '1'});
check('fix partial: apply records the advance on the existing order', r.body.applied === true && manualPayments.length === 1 && manualPayments[0].amount === '199.00' && r.body.balance_to_collect === 2800, JSON.stringify(r.body));
shopifyOrderState = {...shopifyOrderState, displayFinancialStatus: 'PARTIALLY_PAID', totalReceivedSet: {shopMoney: {amount: '199.0', currencyCode: 'INR'}}};
manualPayments.length = 0;
r = await cronGet({order_id: 'partial12345', fix_partial: '1', apply: '1'});
check('fix partial: running again does nothing (already correct)', r.body.result === 'already correct' && manualPayments.length === 0);
shopifyOrderState = {...shopifyOrderState, name: '#1043', displayFinancialStatus: 'PAID', totalReceivedSet: {shopMoney: {amount: '2999.0', currencyCode: 'INR'}}};
r = await cronGet({order_id: 'partial12345', fix_partial: '1', apply: '1'});
check('fix partial: wrongly "Paid" in full -> manual correction explained, nothing changed', r.body.result === 'needs a manual correction' && /refund ₹2800\.00/.test(r.body.how) && manualPayments.length === 0, JSON.stringify(r.body).slice(0, 300));
// Shiprocket says plain COD (as for #1044) but the dashboard shows ₹199 paid: advance given
mockStore({details: srOrder('cod1044aaaaa', {payment_type: 'CASH_ON_DELIVERY'}), inShopify: ['sr-cod1044aaaaa']});
shopifyOrderState = {name: '#1044', displayFinancialStatus: 'PENDING', totalReceivedSet: {shopMoney: {amount: '0.0', currencyCode: 'INR'}}, totalPriceSet: {shopMoney: {amount: '2999.0'}}};
manualPayments.length = 0;
r = await cronGet({order_id: 'cod1044aaaaa', fix_partial: '1'});
check('fix partial: plain COD per Shiprocket, no advance given -> says so, suggests advance', /nothing to change/.test(r.body.result) && /advance/.test(r.body.result) && manualPayments.length === 0);
r = await cronGet({order_id: 'cod1044aaaaa', fix_partial: '1', advance: '199'});
check('fix partial: advance=199 preview -> ₹199 paid, ₹2800 due, nothing changed', r.body.applied === false && r.body.advance_paid_online === 199 && r.body.balance_to_collect === 2800 && manualPayments.length === 0, JSON.stringify(r.body));
r = await cronGet({order_id: 'cod1044aaaaa', fix_partial: '1', apply: '1', advance: '199'});
check('fix partial: advance=199 apply -> records ₹199 on the order', r.body.applied === true && manualPayments.length === 1 && manualPayments[0].amount === '199.00', JSON.stringify(r.body));
r = await cronGet({order_id: 'cod1044aaaaa', fix_partial: '1', apply: '1', advance: '5000'});
check('fix partial: advance >= order total -> 400', r.status === 400);
r = await cronGet({order_id: 'cod1044aaaaa', fix_partial: '1', apply: '1', advance: 'abc'});
check('fix partial: advance not a number -> 400', r.status === 400);
shopifyOrderState = {...shopifyOrderState, name: '#1046', displayFinancialStatus: 'PAID', totalReceivedSet: {shopMoney: {amount: '3499.0', currencyCode: 'INR'}}, totalPriceSet: {shopMoney: {amount: '3499.0'}}};
manualPayments.length = 0;
r = await cronGet({order_id: 'cod1044aaaaa', fix_partial: '1', apply: '1', advance: '199'});
check('fix partial: advance on an order marked fully Paid -> manual steps, nothing changed', r.body.result === 'needs a manual correction' && /refund ₹3300.00/.test(r.body.how) && manualPayments.length === 0, JSON.stringify(r.body).slice(0, 300));

mockStore({details: srOrder('plaincod1234'), inShopify: ['sr-plaincod1234']});
r = await cronGet({order_id: 'plaincod1234', fix_partial: '1', apply: '1'});
check('fix partial: plain COD order left alone', /not partial COD/.test(r.body.result) && manualPayments.length === 0);

r = await call(confirmHandler, {method: 'GET'});
check('confirm: GET -> 405', r.status === 405);
r = await call(confirmHandler, {body: {order_id: 'x'}});
check('confirm: invalid order_id -> 400', r.status === 400);
mockStore({details: srOrder('prepaid12345', {payment_type: 'PREPAID', payment_status: 'SUCCESS'})});
calls.length = 0;
r = await call(confirmHandler, {body: {order_id: 'prepaid12345', total_amount_payable: 1}});
const paidOrder = shopifyCreates()[0] && JSON.parse(shopifyCreates()[0].init.body).order;
check('confirm: paid prepaid order created, from Shiprocket data (not the browser body)', r.status === 200 && r.body.ok === true && paidOrder?.financial_status === 'paid' && paidOrder.transactions[0].amount === '2999.00', JSON.stringify(r.body));
check('confirm: only ok/placed/value/event_id returned (no customer details)', Object.keys(r.body).sort().join() === 'event_id,ok,placed,value' && r.body.event_id === '#1001' && r.body.placed === true && r.body.value === 2999, JSON.stringify(r.body));
mockStore({details: srOrder('unpaid123456', {payment_type: 'PREPAID', payment_status: 'PENDING'})});
calls.length = 0;
r = await call(confirmHandler, {body: {order_id: 'unpaid123456'}});
check('confirm: prepaid order with unpaid payment is not created, not reported as placed', r.status === 200 && shopifyCreates().length === 0 && r.body.placed === false);
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

// Lookup of an older order (#1044 case): Order Details says not found, the list is 1-based
// (page 0 = page 1) and the order sits behind 50 newer abandoned checkouts
{
  const OLD = '6adf59dc635940518bf89090';
  const newer = Array.from({length: 50}, (_, i) => srOrder('6ae0' + String(i).padStart(20, '0'), {status: 'INITIATED'}));
  const target = srOrder(OLD, {payment_type: 'PARTIAL_COD', payment_status: 'PENDING', prepaid_amount: 199});
  let listBody = null;
  mockStore({});
  const inner = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u.includes('details/list')) {
      const body = JSON.parse(init.body);
      listBody = listBody || body;
      const page = Math.max(1, body.page);
      return new Response(JSON.stringify({result: page === 1 ? newer : page === 2 ? [target] : []}), {status: 200});
    }
    if (u.includes('custom-platform-order/details')) {
      return new Response(JSON.stringify({ok: false, message: 'Order not found'}), {status: 400});
    }
    return inner(url, init);
  };
  r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {order_id: OLD, inspect: '1'}});
  check('lookup: order behind 50 newer ones on a 1-based list is found', r.status === 200 && r.body.found_by === 'order list' && r.body.detected.partial_cod.paid === 199, JSON.stringify(r.body).slice(0, 200));
  const placedAt = parseInt(OLD.slice(0, 8), 16) * 1000;
  check('lookup: list searched around the time in the order id', listBody && Math.abs(new Date(listBody.startDate).getTime() - (placedAt - 86400000)) < 1000, listBody && listBody.startDate);
  r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {order_id: '6adf59dc635940518bf8ffff', inspect: '1'}});
  check('lookup: not found -> 404 with what Shiprocket answered', r.status === 404 && r.body.lookup.details_status === 400 && r.body.lookup.list_searched === 51, JSON.stringify(r.body.lookup));
}

// #1044 for real: the Shopify order's id (from the webhook) isn't in Shiprocket's list at all;
// the list has the same purchase under another id, a second later
{
  const WEBHOOK_ID = '6adf59dc635940518bf89090';
  const LIST_ID = '6adf59dd0000000000000001';
  const listed = srOrder(LIST_ID, {payment_type: 'PARTIAL_COD', payment_status: 'PENDING', prepaid_amount: 199, phone: '9876543210'});
  const other = srOrder('6adf59dd0000000000000002', {phone: '9123456789'});
  mockStore({});
  const inner = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u.includes('details/list')) return new Response(JSON.stringify({result: Math.max(1, JSON.parse(init.body).page) === 1 ? [other, listed] : []}), {status: 200});
    if (u.includes('custom-platform-order/details')) return new Response(JSON.stringify({ok: false, error: {code: 400, status: 'BAD_REQUEST', message: 'Order not found'}}), {status: 400});
    if (u.includes('/admin/api/') && String(init.body).includes('lineItems') && String(init.body).includes(WEBHOOK_ID)) {
      return new Response(JSON.stringify({data: {orders: {nodes: [{name: '#1044', createdAt: new Date(0x6adf59dc * 1000 + 4000).toISOString(),
        email: null, phone: '+919876543210', shippingAddress: {phone: '+919876543210'},
        lineItems: {nodes: [{quantity: 1, variant: {legacyResourceId: '50501821923493'}}]}}]}}}), {status: 200});
    }
    return inner(url, init);
  };
  r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {order_id: WEBHOOK_ID, inspect: '1'}});
  check('lookup: id only in the webhook -> found as same customer + items as the Shopify order', r.status === 200 && String(r.body.found_by).includes('same customer + items as #1044') && r.body.detected.partial_cod.paid === 199, JSON.stringify(r.body).slice(0, 250));
  r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {order_id: '6adf59dc635940518bf8ffff', inspect: '1'}});
  check('lookup: miss shows Shiprocket error text', r.status === 404 && r.body.lookup.details_message === 'Order not found', JSON.stringify(r.body.lookup));
}

// #1050: the list holds summaries only; the full record comes from Order Details by list id
{
  const WEBHOOK_ID = '6ae2c53a9c1a5e7bf2f457b7';
  const LIST_ID = '6ae2c53b0000000000000001';
  const FAR_ID = '6ae2a0000000000000000002'; // hours earlier: not read in full
  const full = srOrder(LIST_ID, {payment_type: 'PARTIAL_COD', payment_status: 'PENDING', prepaid_amount: 199});
  const detailsAsked = [];
  mockStore({});
  const inner = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u.includes('details/list')) {
      const page = Math.max(1, JSON.parse(init.body).page);
      return new Response(JSON.stringify({result: page === 1 ? [{order_id: FAR_ID, status: 'INITIATED'}, {order_id: LIST_ID, status: 'SUCCESS'}] : []}), {status: 200});
    }
    if (u.includes('custom-platform-order/details')) {
      const id = JSON.parse(init.body).order_id;
      detailsAsked.push(id);
      return id === LIST_ID
        ? new Response(JSON.stringify({ok: true, result: full}), {status: 200})
        : new Response(JSON.stringify({ok: false, error: {message: 'Order not found'}}), {status: 400});
    }
    if (u.includes('/admin/api/') && String(init.body).includes('lineItems') && String(init.body).includes(WEBHOOK_ID)) {
      return new Response(JSON.stringify({data: {orders: {nodes: [{name: '#1050', createdAt: new Date(0x6ae2c53a * 1000 + 3000).toISOString(),
        email: null, phone: '+919876543210', shippingAddress: {phone: '+919876543210'},
        lineItems: {nodes: [{quantity: 1, variant: {legacyResourceId: '50501821923493'}}]}}]}}}), {status: 200});
    }
    return inner(url, init);
  };
  r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}, query: {order_id: WEBHOOK_ID, inspect: '1'}});
  check('lookup: summary-only list -> nearby record read in full and matched', r.status === 200 && String(r.body.found_by).includes('#1050') && r.body.detected.partial_cod.paid === 199, JSON.stringify(r.body).slice(0, 250));
  check('lookup: only records placed near the order are read in full', detailsAsked.includes(LIST_ID) && !detailsAsked.includes(FAR_ID), detailsAsked.join(','));
}

mockFetch([['details/list', {status: 401, body: {message: 'bad'}}]]);
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}});
check('reconcile: Shiprocket failure -> 502 (workflow run fails visibly)', r.status === 502);
setServerEnv(ENV);
r = await call(reconcileHandler, {method: 'GET', headers: {authorization: 'Bearer cron-secret'}});
check('reconcile: no Admin API access -> 500', r.status === 500);

console.log(`\n${pass}/${pass + fail} server checks passed`);
process.exit(fail ? 1 : 0);
