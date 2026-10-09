import { api,json,body,originCheck,rate,AppError } from "@/lib/order-server";
import { searchDestinations,shippingQuote,shippingQuotes } from "@/lib/checkout-shipping";
import { catalogQuote } from "@/lib/catalog-bridge";
import { orderShippingGrams } from "@/lib/order-items";
export const POST=(r:Request)=>api(async()=>{
 originCheck(r);const v=await body(r);
 if(v.action==="search"){await rate(r,"shipping_search",80);return json({locations:await searchDestinations(v.query)});}
 if(v.action==="quote"||v.action==="rates"){
  await rate(r,"shipping_quote",30);
  const linked=v.catalogToken?await catalogQuote(v.catalogToken):null;
  const quantity=linked?linked.lines.reduce((sum,line)=>sum+line.quantity,0):v.quantity;
  let grams:number;try{grams=orderShippingGrams(quantity)}catch(e){throw new AppError(400,(e as Error).message)}
  return json(v.action==="rates"?{quotes:await shippingQuotes(v.destinationId,grams)}:await shippingQuote(v.destinationId,grams));
 }
 throw new AppError(400,"Permintaan ongkir tidak valid.");
});
