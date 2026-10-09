import { env } from 'cloudflare:workers';
import { db,AppError,settings,decrypt,telegram } from './order-server';
import type { Order } from './order-types';
export type CatalogLine={productId:string;groupId:string;quantity:number;name:string;label:string;instagramUrl:string;unitPrice:number};
export type CatalogQuote={id:string;lines:CatalogLine[];amount:number;expiresAt:number;customer?:{name:string;phone:string|null}};
export function catalogConfigured(){return !!(env.CATALOG_ORIGIN?.startsWith('https://')&&env.CATALOG_BRIDGE_SECRET&&env.CATALOG_BRIDGE_SECRET.length>=32)}
async function bridge<T>(data:Record<string,unknown>):Promise<T>{
 if(!catalogConfigured())throw new AppError(503,'Penghubung stok katalog belum dikonfigurasi.');
 let r:Response;try{r=await fetch(env.CATALOG_ORIGIN+'/api/internal/orders',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json','x-elite-bridge':env.CATALOG_BRIDGE_SECRET!},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)})}catch{throw new AppError(503,'Katalog belum dapat dihubungi. Stok belum terverifikasi; coba sinkron ulang.')}
 let v:any;try{v=await r.json()}catch{throw new AppError(503,'Penghubung katalog memberikan respons tidak valid. Coba sinkron ulang.')}
 if(!r.ok)throw new AppError(r.status===409?409:r.status===410?410:503,typeof v.error==='string'?v.error:'Stok katalog belum dapat disinkronkan.');return v as T;
}
export async function catalogHealth(){if(!catalogConfigured())return false;try{const v=await bridge<{service:string}>({op:'ping'});return v.service==='ELITE.VTG catalog'}catch{return false}}
export async function catalogQuote(token:unknown){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw new AppError(400,'Tautan barang katalog tidak valid.');return bridge<CatalogQuote>({op:'quote',token})}
export function catalogItems(q:CatalogQuote){const items=q.lines.flatMap(l=>Array.from({length:l.quantity},()=>`${l.name} · ${l.label}`));return {items,quantity:items.length,item:items.length===1?items[0]:items.map((x,i)=>`${i+1}. ${x}`).join('\n'),itemAmount:q.amount}}
export async function synchronizeCatalogStock(id:string){
 const o=await db().prepare('SELECT * FROM orders WHERE id=?').bind(id).first<Order>();if(!o)throw new AppError(404,'Pesanan tidak ditemukan.');if(!o.catalog_checkout_id)return {state:'unlinked'};if(o.payment_state!=='payment_confirmed')throw new AppError(409,'Konfirmasi pembayaran melalui Telegram dahulu.');if(o.stock_sync_state==='applied')return {state:'applied',duplicate:true};
 try{const result=await bridge<{applied:boolean;duplicate:boolean}>({op:'sale',orderId:id,checkoutId:o.catalog_checkout_id,actor:o.confirmed_by});if(!result.applied)throw new AppError(503,'Pengurangan stok belum terverifikasi.');
  const changed=await db().prepare("UPDATE orders SET stock_sync_state='applied',stock_sync_error=NULL WHERE id=? AND stock_sync_state!='applied' RETURNING id").bind(id).first();
  if(changed){const s=await settings();if(s?.bot_cipher&&s.chat_id===o.delivery_chat)await telegram(await decrypt(s.bot_cipher),'sendMessage',{chat_id:s.chat_id,text:`ELITE.VTG · ${id}\nPembayaran dikonfirmasi. Stok katalog sudah dikurangi sesuai barang dan ukuran pesanan.`,reply_markup:{inline_keyboard:[[{text:'Buka katalog',url:env.CATALOG_ORIGIN!}]]}}).catch(()=>{})}
  return {state:'applied',duplicate:result.duplicate};
 }catch(e){const message=e instanceof AppError?e.message:'Sinkron stok belum berhasil. Coba lagi.';await db().prepare("UPDATE orders SET stock_sync_state=?,stock_sync_error=? WHERE id=? AND stock_sync_state!='applied'").bind(e instanceof AppError&&e.status===409?'conflict':'error',message,id).run();const current=await db().prepare('SELECT stock_sync_state FROM orders WHERE id=?').bind(id).first<{stock_sync_state:string}>();if(current?.stock_sync_state==='applied')return {state:'applied',duplicate:true};throw new AppError(e instanceof AppError?e.status:503,message+' Pengiriman ditahan sampai stok terselesaikan.')}
}
