import { api,json,originCheck,body,rate } from "@/lib/order-server";
import { trackingOrder,trackingAccess,lookupTracking,customerTracking } from "@/lib/customer-tracking";
export const GET=(r:Request)=>api(async()=>{const o=await trackingOrder(r);await rate(r,"tracking_read",150);const access=await trackingAccess(o);return json({...await customerTracking(o),accessUrl:access.url});});
export const POST=(r:Request)=>api(async()=>{originCheck(r);await rate(r,"tracking_lookup",8);const v=await body(r),o=await lookupTracking(v.invoice,v.phone),access=await trackingAccess(o);return json({...await customerTracking(o),accessUrl:access.url});});
