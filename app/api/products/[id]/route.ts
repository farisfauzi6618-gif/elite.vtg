import { boundary,readProduct,response,AppError } from '@/lib/server';
import { publicProduct } from '@/lib/catalog-types';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){return boundary(async()=>{const {id}=await params;const p=await readProduct(id);if(p.status!=='published')throw new AppError(404,'Barang tidak tersedia.');return response({product:publicProduct(p)})})}
