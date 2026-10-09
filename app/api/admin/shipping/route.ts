import { api,json,owner,originCheck,body,AppError,text } from "@/lib/order-server";
import { shippingSettings,saveShippingSettings,kiriminClient } from "@/lib/shipping-settings";
import { ensureTelegramWebhook } from "@/lib/telegram-actions";
import { ensureKiriminWebhook } from "@/lib/kirimin-webhook";
export const GET=()=>api(async()=>{await owner();return json(await shippingSettings());});
export const POST=(r:Request)=>api(async()=>{originCheck(r);await owner();const v=await body(r);
 if(v.action==="save"){await saveShippingSettings(v);return json(await shippingSettings());}
 if(v.action==="search"){const q=text(v.query,"Wilayah",3,100);return json({locations:await (await kiriminClient()).search(q)});}
 if(v.action==="webhook"){await ensureTelegramWebhook();return json(await shippingSettings());}
 if(v.action==="kirimin-webhook"){await ensureKiriminWebhook();return json(await shippingSettings());}
 throw new AppError(400,"Tindakan tidak valid.");
});
