import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.join(fs.realpathSync('node_modules/wrangler'), 'package.json'));
const { Miniflare } = require('miniflare');
const server = path.resolve('dist/server');
const files = fs.readdirSync(server, { recursive: true }).filter(f => f.endsWith('.js')).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:a.localeCompare(b));
const mf = new Miniflare({ name: 'customer-qa', modulesRoot: server, modules: files.map(f => ({ type: 'ESModule', path: path.join(server, f) })), compatibilityDate: '2026-05-15', compatibilityFlags: ['nodejs_compat'], d1Databases: ['DB'], r2Buckets: ['BUCKET'], bindings: { ADMIN_EMAIL: 'owner@elite.test', ORDER_ORIGIN: 'https://order.test', CATALOG_BRIDGE_SECRET: 'TEST_ONLY_CATALOG_SECRET_1234567890' }, assets: { workerName: 'customer-qa', directory: path.resolve('dist/client'), binding: 'ASSETS', routerConfig: { invoke_user_worker_ahead_of_assets: true, has_user_worker: true } } });
let count = 0;
function pass(label) { count++; console.log('PASS ' + label); }
const origin = 'https://catalog.test', password = 'Correct horse battery 2026!';
async function api(method, data, cookie = '', extra = {}) {
  const r = await mf.dispatchFetch(origin + '/api/customer', { method, headers: { origin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...extra }, ...(data ? { body: JSON.stringify(data) } : {}) });
  return { r, value: await r.json(), cookie: r.headers.get('set-cookie')?.split(';')[0] };
}
try {
  const d = await mf.getD1Database('DB');
  for (const file of fs.readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) for (const sql of fs.readFileSync('drizzle/' + file, 'utf8').split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)) await d.prepare(sql).run();
  assert.equal((await api('GET')).value.customer, null); pass('Pengunjung tetap bisa belanja tanpa akun');
  const a = await api('POST', { action: 'register', name: 'Faris Customer', identity: '081234567890', password, birthday: '2001-06-15', consent: true, role: 'owner', userId: 'owner' });
  assert.equal(a.r.status, 201, JSON.stringify(a.value)); assert.equal(a.value.customer.phone, '+6281234567890');
  const cookie = a.r.headers.get('set-cookie'); for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax']) assert.ok(cookie.includes(flag)); assert.ok(!cookie.includes('Domain='));
  const stored = await d.prepare('SELECT * FROM customers').first(); assert.ok(stored.password_hash.startsWith('scrypt$16384$8$5$')); assert.ok(!stored.password_hash.includes(password)); assert.equal(a.value.customer.id, undefined); assert.equal(a.value.customer.password_hash, undefined);
  pass('Pendaftaran nyata di Worker: sandi scrypt, cookie aman, nomor HP dinormalisasi');
  assert.equal((await api('POST', { action: 'register', name: 'Other', identity: '+62 81234567890', password, consent: true })).r.status, 409);
  assert.equal((await api('POST', { action: 'register', name: 'Other', identity: 'bad@elite.test', password, birthday: '2000-02-31', consent: true })).r.status, 400);
  assert.equal((await api('POST', { action: 'register', name: 'Other', identity: 'bad@elite.test', password: 'short', consent: true })).r.status, 400);
  assert.equal((await api('POST', { action: 'register', name: 'Other', identity: 'bad@elite.test', password, consent: false })).r.status, 400);
  pass('Duplikat identitas, tanggal salah, sandi pendek, dan persetujuan kosong ditolak');
  const b = await api('POST', { action: 'register', name: 'Second Customer', identity: ' SECOND@Elite.Test ', password, consent: true });
  assert.equal(b.r.status, 201); assert.equal(b.value.customer.email, 'second@elite.test'); assert.equal(b.value.customer.birthday, null);
  assert.notEqual((await d.prepare('SELECT password_hash FROM customers WHERE email=?').bind('second@elite.test').first()).password_hash, stored.password_hash);
  assert.equal((await api('GET', null, a.cookie)).value.customer.name, 'Faris Customer'); assert.equal((await api('GET', null, b.cookie)).value.customer.name, 'Second Customer');
  pass('Email dan HP bisa dipakai, ulang tahun opsional, profil antarpelanggan terpisah');
  const wrong = await api('POST', { action: 'login', identity: '081234567890', password: 'wrong password' });
  const absent = await api('POST', { action: 'login', identity: 'unknown@elite.test', password });
  assert.equal(wrong.r.status, 401); assert.equal(absent.r.status, 401); assert.equal(wrong.value.error, absent.value.error);
  const login = await api('POST', { action: 'login', identity: '6281234567890', password }, a.cookie); assert.equal(login.r.status, 200); assert.notEqual(login.cookie, a.cookie); assert.equal((await api('GET', null, a.cookie)).value.customer, null);
  pass('Sandi salah ditolak; login valid mengganti sesi sebelumnya');
  const foreign = await api('POST', { action: 'login', identity: '081234567890', password }, '', { origin: 'https://evil.test' }); assert.equal(foreign.r.status, 403);
  assert.equal((await api('DELETE', null, login.cookie, { origin: 'https://evil.test' })).r.status, 403);
  assert.equal((await mf.dispatchFetch(origin + '/api/admin', { headers: { cookie: login.cookie } })).status, 401);
  assert.equal((await mf.dispatchFetch(origin + '/api/photos', { method: 'POST', headers: { cookie: login.cookie, origin } })).status, 401);
  pass('Sesi pelanggan tidak memberi hak admin/unggah foto; permintaan lintas situs ditolak');
  const now = new Date().toISOString();
  await d.prepare("INSERT INTO products(id,shortcode,instagram_url,name,brand,category,price,condition,defects,status,created_at,updated_at) VALUES('p','manual:p','','PRL Knit','PRL','Sweater & Knitwear',300000,'Good','Tidak ada','published',?,?)").bind(now, now).run();
  await d.prepare("INSERT INTO size_groups(id,product_id,fits,qty) VALUES('g','p','[\"M\"]',5)").run();
  const ck = await mf.dispatchFetch(origin + '/api/checkout', { method: 'POST', headers: { origin, 'content-type': 'application/json', cookie: login.cookie }, body: JSON.stringify({ lines: [{ productId: 'p', groupId: 'g', quantity: 4 }], customerId: 'forged' }) }); assert.equal(ck.status, 201);
  const token = new URL((await ck.json()).url).searchParams.get('catalog');
  const linked = await mf.dispatchFetch(origin + '/api/internal/orders', { method: 'POST', headers: { 'content-type': 'application/json', 'x-elite-bridge': 'TEST_ONLY_CATALOG_SECRET_1234567890' }, body: JSON.stringify({ op: 'quote', token }) });
  const quote = await linked.json(); assert.deepEqual(quote.customer, { name: 'Faris Customer', phone: '+6281234567890' }); assert.equal(quote.lines[0].quantity, 4); assert.equal(quote.customer.birthday, undefined); assert.equal(quote.customer.password_hash, undefined);
  const check = await d.prepare('SELECT customer_id FROM catalog_checkouts').first(); assert.equal(check.customer_id, stored.id);
  pass('Checkout memakai identitas sesi; hanya nama dan HP diteruskan ke order');
  await api('DELETE', null, login.cookie); assert.equal((await api('GET', null, login.cookie)).value.customer, null);
  await d.prepare('UPDATE customer_sessions SET expires_at=0').run(); assert.equal((await api('GET', null, b.cookie)).value.customer, null);
  pass('Keluar dan kedaluwarsa sesi membatalkan akses akun');
  // Different IPs cannot evade the rate limit for a targeted identity.
  await d.prepare('DELETE FROM request_limits').run();
  for (let i = 0; i < 20; i++) assert.equal((await api('POST', { action: 'login', identity: 'attacked@elite.test', password }, '', { 'cf-connecting-ip': '192.0.2.' + i })).r.status, 401);
  assert.equal((await api('POST', { action: 'login', identity: 'attacked@elite.test', password }, '', { 'cf-connecting-ip': '192.0.2.99' })).r.status, 429);
  pass('Pembatasan login per identitas tetap berlaku ketika IP berubah');
  console.log(`${count} customer integration checks passed`);
} finally { await mf.dispose(); }
