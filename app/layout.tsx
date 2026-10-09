import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'ELITE.VTG — Shop', description:'Belanja koleksi ELITE.VTG. Lihat foto, kondisi, minus, ukuran aktual, dan stok, lalu lanjutkan ke pembayaran.', icons:{icon:'/favicon.svg?v=order-style-20261008',shortcut:'/favicon.svg?v=order-style-20261008'} };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="id"><body>{children}</body></html>}
