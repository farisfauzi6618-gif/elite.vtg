import { readLimitedText } from '@/lib/request-limits';
import { api,json,AppError } from "@/lib/order-server";
import { verifyKiriminWebhook,receiveKiriminWebhook } from "@/lib/kirimin-webhook";
type Context={params:Promise<{token:string}>};
export const GET=(_req:Request,c:Context)=>api(async()=>{await verifyKiriminWebhook((await c.params).token);return json({ok:true});});
export const POST=(req:Request,c:Context)=>api(async()=>{
 const s=await verifyKiriminWebhook((await c.params).token,req);
 if(Number(req.headers.get("content-length")||0)>65536)throw new AppError(413,"Callback terlalu besar.");
 const raw=await readLimitedText(req,65536);if(raw.length>65536)throw new AppError(413,"Callback terlalu besar.");
 let value:unknown;try{value=JSON.parse(raw);}catch{throw new AppError(400,"Callback tidak valid.");}
 await receiveKiriminWebhook(value,s);return json({ok:true});
});
