import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
const d=new DatabaseSync(':memory:');
const migrations=readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort();
for(const file of migrations.filter(f=>!f.startsWith('0006_')))d.exec(readFileSync('drizzle/'+file,'utf8'));
const old=[['knit','PRL Cable Knit Quarter Zip','Knitwear'],['sweat','PRL Quarterzip Sweatshirt','Sweatshirt'],['ambiguous','PRL Crewneck','Crewneck'],['other','Vintage Top','Lainnya'],['shirt','PRL Poplin Shirt','Kemeja'],['polo','PRL Polo Longsleeve','Polo']];
for(const [id,name,category] of old){d.prepare("INSERT INTO products(id,shortcode,instagram_url,name,brand,category,color,price,condition,defects,photo_key,photo_keys,description,caption,warnings,reviewed,status,created_at,updated_at,published_at,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id,'Legacy'+id,'https://www.instagram.com/p/Legacy'+id+'/',name,'PRL',category,'Navy',365000,'Good','–','photo-'+id,JSON.stringify(['photo-'+id,'extra-'+id]),'Original description','Original caption','[]',1,'published','2026-10-01','2026-10-01','2026-10-01',7);d.prepare("INSERT INTO size_groups(id,product_id,label,tag_size,fits,length_cm,width_cm,qty,revision,sort_order) VALUES(?,?,?,'M','[\"S\",\"M\"]',72,50,3,4,0)").run('g-'+id,id,'Fit S–M');d.prepare('INSERT INTO stock_history(id,group_id,product_id,before_qty,after_qty,before_revision,after_revision,reason,actor,created_at) VALUES(?,?,?,4,3,3,4,?,?,?)').run('h-'+id,'g-'+id,id,'Sold','owner','2026-10-01')}
const before=d.prepare('SELECT * FROM products ORDER BY id').all();
const groups=d.prepare('SELECT * FROM size_groups ORDER BY id').all(),history=d.prepare('SELECT * FROM stock_history ORDER BY id').all();
d.exec(readFileSync('drizzle/0006_wonderful_pyro.sql','utf8'));
const after=d.prepare('SELECT * FROM products ORDER BY id').all();
for(let i=0;i<before.length;i++){const {category:oldCategory,version:oldVersion,...unchanged}=before[i];const {category,version,legacy_category,feature_ids,...actual}=after[i];assert.deepEqual(actual,unchanged);assert.equal(legacy_category,oldCategory);assert.equal(version,oldVersion+1)}
assert.deepEqual(d.prepare('SELECT * FROM size_groups ORDER BY id').all(),groups);
assert.deepEqual(d.prepare('SELECT * FROM stock_history ORDER BY id').all(),history);
const row=id=>d.prepare('SELECT * FROM products WHERE id=?').get(id);
assert.equal(row('knit').category,'Sweater & Knitwear');assert.deepEqual(JSON.parse(row('knit').feature_ids),['quarter-zip','cable-knit']);
assert.equal(row('sweat').category,'Sweatshirt & Hoodie');assert.deepEqual(JSON.parse(row('sweat').feature_ids),['quarter-zip']);
assert.equal(row('ambiguous').category,'');assert.equal(row('ambiguous').legacy_category,'Crewneck');assert.deepEqual(JSON.parse(row('ambiguous').feature_ids),['crewneck']);
assert.equal(row('other').category,'');assert.equal(row('other').status,'published');
assert.equal(row('polo').category,'Polo');assert.deepEqual(JSON.parse(row('polo').feature_ids),['long-sleeve']);
assert.equal(d.prepare('SELECT COUNT(*) n FROM catalog_features').get().n,9);
console.log('PASS Migrasi hanya memetakan kategori/ciri yang jelas; seluruh produk, foto, harga, fit, ukuran, stok, publikasi, dan riwayat tetap utuh.');
d.close();
