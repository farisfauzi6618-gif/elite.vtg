import { checkoutRate } from '@/lib/request-rate';
import { boundary,readJson,response,AppError } from '@/lib/server';
import { createCheckout,checkoutConfigured } from '@/lib/checkout';
import { currentCustomer } from '@/lib/customers';
export const GET=()=>response({configured:checkoutConfigured()});
export const POST=(request:Request)=>boundary(async()=>{if(request.headers.get('origin')!==new URL(request.url).origin)throw new AppError(403,'Buka pembayaran dari katalog ELITE.VTG.');await checkoutRate(request);const customer=await currentCustomer(request.headers.get('cookie'));return response(await createCheckout(await readJson(request),customer?.id??null),201)});
