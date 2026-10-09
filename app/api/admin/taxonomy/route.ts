import {boundary,requireAdmin,readJson,response,AppError} from '@/lib/server';
import {readTaxonomy,addFeature,addAliases} from '@/lib/taxonomy-service';
export const dynamic='force-dynamic';
export async function GET(request:Request){return boundary(async()=>{await requireAdmin(request);return response(await readTaxonomy())})}
export async function POST(request:Request){return boundary(async()=>{await requireAdmin(request);const data=await readJson(request);if(data?.op==='add')return response(await addFeature(data),201);if(data?.op==='aliases')return response(await addAliases(data));throw new AppError(400,'Aksi tidak dikenal.')})}
