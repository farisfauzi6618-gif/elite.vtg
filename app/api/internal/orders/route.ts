import { boundary,readJson,response,AppError } from '@/lib/server';
import { authorizeBridge,quoteCheckout,applyCheckoutSale } from '@/lib/checkout';
export const POST=(request:Request)=>boundary(async()=>{await authorizeBridge(request);const v=await readJson(request);if(v.op==='ping')return response({service:'ELITE.VTG catalog'});if(v.op==='quote')return response(await quoteCheckout(v.token));if(v.op==='sale')return response(await applyCheckoutSale(v));throw new AppError(400,'Aksi penghubung tidak valid.')});
