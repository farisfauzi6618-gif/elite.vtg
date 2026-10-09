import { api,json,owner } from "@/lib/order-server";
import { labelPrintInfo } from "@/lib/label-print";
export const GET=(_r:Request,ctx:{params:Promise<{id:string}>})=>api(async()=>{await owner();return json(await labelPrintInfo((await ctx.params).id));});
