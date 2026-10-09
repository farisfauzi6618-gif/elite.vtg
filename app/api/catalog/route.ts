import {readTaxonomy} from '@/lib/taxonomy-service';
import { boundary,readProducts,response } from '@/lib/server';
import { publicProduct } from '@/lib/catalog-types';
export const dynamic='force-dynamic';
export async function GET(){return boundary(async()=>response({products:(await readProducts()).map(publicProduct),taxonomy:await readTaxonomy(),asOf:new Date().toISOString()}))}
