import { boundary,checkAdminOrigin,readJson,response } from '@/lib/server';
import { startTeamSession,endTeamSession,sessionCookie } from '@/lib/team-access';
import { publicRate } from '@/lib/request-rate';
export const POST=(r:Request)=>boundary(async()=>{checkAdminOrigin(r);await publicRate(r,'team-login',30);const v=await readJson(r);const result=await startTeamSession(v?.token);const out=response({ok:true,name:result.name});out.headers.set('Set-Cookie',sessionCookie(r,result.session,result.expires));return out});
export const DELETE=(r:Request)=>boundary(async()=>{checkAdminOrigin(r);await endTeamSession(r.headers.get('cookie'));const out=response({ok:true});out.headers.set('Set-Cookie',sessionCookie(r,''));return out});
