import { api,owner,originCheck,AppError } from "@/lib/order-server";
export const POST=(r:Request)=>api(async()=>{
 originCheck(r);const user=await owner();
 console.warn("Payment destination change denied",{actor:user.userId,action:"dashboard_qris_change"});
 throw new AppError(403,"Tujuan pembayaran hanya dapat diubah melalui konfigurasi deployment pemilik.");
});
