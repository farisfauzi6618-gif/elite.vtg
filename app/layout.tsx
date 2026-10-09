import type { Metadata } from "next";
import "./globals.css";
const title = "ELITE.VTG — Form Order";
const description = "Lengkapi pesanan ELITE.VTG, bayar melalui QRIS DANA, dan kirim bukti pembayaran.";
const origin = "https://elite-vtg-order.farisfzi.chatgpt.site";
const preview = {
  url: origin + "/og.png",
  width: 1730,
  height: 909,
  type: "image/png",
  alt: "Logo ELITE.VTG",
};
export const metadata:Metadata={
  metadataBase:new URL(origin),
  title,
  description,
  openGraph:{title,description,siteName:"ELITE.VTG",type:"website",locale:"id_ID",images:[preview]},
  twitter:{card:"summary_large_image",title,description,images:[preview]},
  robots:{index:false,follow:false},
  icons:{icon:"/favicon.svg?v=thin-20261006"},
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>;}
