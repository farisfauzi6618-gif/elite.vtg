import { api,json,owner,db,AppError } from "@/lib/order-server";
import { trackingAccess,customerTracking } from "@/lib/customer-tracking";
import type { Order } from "@/lib/order-types";
export const GET=(_r:Request,ctx:{params:Promise<{id:string}>})=>api(async()=>{await owner();const {id}=await ctx.params,o=await db().prepare("SELECT * FROM orders WHERE id=?").bind(id).first<Order>();if(!o)throw new AppError(404,"Pesanan tidak ditemukan.");const access=await trackingAccess(o);return json({...await customerTracking(o),accessUrl:access.url});});
