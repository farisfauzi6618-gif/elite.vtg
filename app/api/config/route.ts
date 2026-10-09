import { api,json,settings,ready } from "@/lib/order-server";
import { kiriminSettings } from "@/lib/shipping-settings";
import { catalogHealth } from "@/lib/catalog-bridge";
import { paymentConfig } from "@/lib/payment-config";
export const GET=()=>api(async()=>{const s=await settings(),{config}=await kiriminSettings(),payment=await paymentConfig();return json({ready:await ready(s,payment),payment,merchant:payment.qris?.merchant,qris:!!payment.qris,defaultGrams:config.defaultGrams,catalogConnected:await catalogHealth()});});
