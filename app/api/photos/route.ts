import { boundary,requireAdmin,response } from '@/lib/server';
import { uploadPhoto } from '@/lib/photos';
export async function POST(request:Request){return boundary(async()=>{await requireAdmin(request);return response({photoKey:await uploadPhoto(request)})})}
