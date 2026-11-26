import http from 'node:http';
import {Readable} from 'node:stream';
import {getRuntime} from '../runtime.mjs';
import {createHandler} from '../handler.mjs';
const runtime=getRuntime();if(!runtime.emulator)throw Error('Local test adapter requires emulators');
const handle=createHandler(runtime);
const server=http.createServer(async(req,res)=>{
 const request=new Request('http://127.0.0.1'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
 const reply=await handle(request,{ip:req.socket.remoteAddress});res.writeHead(reply.status,Object.fromEntries(reply.headers));res.end(Buffer.from(await reply.arrayBuffer()));
});
server.listen(8890,'127.0.0.1',()=>console.log('Local emulator-only API adapter on port 8890; this is not Netlify deployment evidence.'));
