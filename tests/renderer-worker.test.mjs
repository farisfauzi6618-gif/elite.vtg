import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {adaptPdfiumSource} from "../build/pdfium-compat.mjs";
const require=createRequire(import.meta.url),fromWrangler=createRequire(require.resolve("wrangler/package.json")),esbuild=require(fromWrangler.resolve("esbuild")),{Miniflare}=require(fromWrangler.resolve("miniflare"));
test("official PDF becomes a nonempty PNG in the actual Cloudflare worker runtime",async()=>{
 const root=process.cwd()+"/.sites-runtime/worker-render-test";mkdirSync(root,{recursive:true});
 const result=await esbuild.build({stdin:{contents:`import {pdfToPng} from './lib/label-render';export default {async fetch(r){try{return new Response(await pdfToPng(new Uint8Array(await r.arrayBuffer())),{headers:{'Content-Type':'image/png'}})}catch(e){return new Response(e.stack,{status:500})}}}`,resolveDir:process.cwd(),loader:"ts"},bundle:true,format:"esm",platform:"neutral",write:false,plugins:[{name:"bindings",setup(b){b.onLoad({filter:/index\.esm\.browser\.js$/},args=>({contents:adaptPdfiumSource(readFileSync(args.path,"utf8")),loader:"js"}));b.onResolve({filter:/order-server$/},()=>({path:"error",namespace:"error"}));b.onLoad({filter:/.*/,namespace:"error"},()=>({contents:"export class AppError extends Error{constructor(status,message){super(message)}}"}));b.onResolve({filter:/pdfium\.wasm$/},()=>({path:"./pdfium.wasm",external:true}));}}]});
 const mf=new Miniflare({modules:[{type:"ESModule",path:root+"/index.mjs",contents:result.outputFiles[0].text},{type:"CompiledWasm",path:root+"/pdfium.wasm",contents:readFileSync(require.resolve("@hyzyla/pdfium/pdfium.wasm"))}],modulesRoot:root,compatibilityDate:"2026-05-15",compatibilityFlags:["nodejs_compat"]});
 try{const response=await mf.dispatchFetch("https://renderer.test",{method:"POST",body:readFileSync("tests/fixtures/komship-simulated-label.pdf")});if(!response.ok)assert.fail(await response.text());const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");assert.ok(bytes.length>10000);writeFileSync(".sites-runtime/tests/workerd-label.png",bytes);}finally{await mf.dispose();}
});
