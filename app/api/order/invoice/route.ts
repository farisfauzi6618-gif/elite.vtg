import { api,myOrder,AppError } from "@/lib/order-server";
import { invoiceText } from "@/lib/order-types";
import { trackingAccess } from "@/lib/customer-tracking";
export const GET=(r:Request)=>api(async()=>{const o=await myOrder(r);if(o.status==="awaiting_proof")throw new AppError(409,"Kirim bukti pembayaran untuk membuat invoice.");let link="";try{link="\n\nLacak pesanan: "+(await trackingAccess(o)).url;}catch{/* Invoice remains available if link creation is temporarily unavailable. */}return new Response(invoiceText(o)+link,{headers:{"Content-Type":"text/plain; charset=utf-8","Content-Disposition":`attachment; filename=invoice-${o.id}.txt`,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});});
