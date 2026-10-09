import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { owner, AppError } from "@/lib/order-server";
import Link from "next/link";
import Admin from "./ui";
export const dynamic="force-dynamic";
export default async function AdminPage(){await requireChatGPTUser("/admin");try{await owner();}catch(e){return <main className="access-error"><h1>Akses khusus pemilik</h1><p>{e instanceof AppError?e.message:"Pengaturan belum tersedia. Coba lagi."}</p><Link href="/">Kembali ke halaman order</Link></main>;}return <Admin/>;}
