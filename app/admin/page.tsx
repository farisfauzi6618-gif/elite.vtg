import { BrandLogo } from '@/components/brand-logo';
import { requireChatGPTUser, chatGPTSignOutPath } from '../chatgpt-auth';
import { requireAdmin,AppError } from '@/lib/server';
import Admin from './admin';
export const dynamic='force-dynamic';
export const metadata={title:'Admin — ELITE.VTG',robots:{index:false,follow:false}};
export default async function AdminPage(){let user;try{user=await requireAdmin()}catch(e){if(e instanceof AppError&&e.status===401)await requireChatGPTUser('/admin');return <main className="catalog-shell"><header className="masthead"><a className="wordmark" href="/"><BrandLogo/><small>CURATED VINTAGE</small></a></header><div className="empty-state"><h1>Akses admin terbatas</h1><p>{e instanceof AppError?e.message:'Akses belum tersedia.'}</p><a className="button secondary" href={chatGPTSignOutPath('/admin')} target="_top">Keluar dan ganti akun</a></div></main>}return <Admin userName={user!.role==='owner'?user!.email:user!.displayName} isOwner={user!.role==='owner'} signOutPath={user!.role==='owner'?chatGPTSignOutPath('/'):'/akses-tim'} />}
