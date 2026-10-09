import { api,json,rate } from '@/lib/order-server';
import { catalogQuote } from '@/lib/catalog-bridge';
export const GET=(request:Request)=>api(async()=>{await rate(request,'catalog-quote',60);return json(await catalogQuote(new URL(request.url).searchParams.get('token')))});
