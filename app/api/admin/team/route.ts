import { boundary,requireOwner,readJson,response } from '@/lib/server';
import { listTeam,editTeam } from '@/lib/team-access';
export const dynamic='force-dynamic';
export const GET=(r:Request)=>boundary(async()=>{await requireOwner();return response({members:await listTeam(new URL(r.url).origin)})});
export const POST=(r:Request)=>boundary(async()=>{await requireOwner(r);await editTeam(await readJson(r));return response({members:await listTeam(new URL(r.url).origin)})});
