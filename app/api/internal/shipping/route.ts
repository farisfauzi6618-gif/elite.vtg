import { env } from "cloudflare:workers";
import { api,json,hash,AppError,body } from "@/lib/order-server";
import { kiriminSettings,kiriminRatesReady } from "@/lib/shipping-settings";
import { customerLocation,validKiriminOrigin } from "@/lib/kiriminaja";
import { searchDestinations,shippingQuotes } from "@/lib/checkout-shipping";
export const POST=(r:Request)=>api(async()=>{
 const token=r.headers.get("authorization")?.replace(/^Bearer /,"");
 if(!env.SHIPPING_BRIDGE_SECRET||!token||await hash(token)!==await hash(env.SHIPPING_BRIDGE_SECRET))throw new AppError(403,"Akses kalkulator belum sesuai.");
 const v=await body(r),connected=await kiriminRatesReady(),{config}=await kiriminSettings();
 if(v.action==="status")return json({connected,provider:"KiriminAja",origin:validKiriminOrigin(config.origin)?customerLocation(config.origin):null,checkedAt:null});
 if(!connected)throw new AppError(409,"KiriminAja produksi belum diaktifkan pada pengaturan pemilik.");
 if(v.action==="search")return json({locations:await searchDestinations(v.query)});
 if(v.action==="rates"||v.action==="quote"){
  const quotes=await shippingQuotes(v.destinationId,v.grams),first=quotes[0];
  return json({destination:first.destination.label,weight:first.grams/1000,source:"KiriminAja",services:quotes.map(q=>({amount:q.amount,service:q.service,description:q.serviceName,etd:q.etd}))});
 }
 throw new AppError(400,"Tindakan kalkulator tidak valid.");
});
