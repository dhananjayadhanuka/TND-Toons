import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
 let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400).end();return;}
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(file===root)file=path.join(root,'index.html');
 fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404).end('Not found');return;}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);});
});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'Port 47831 is busy. Open http://127.0.0.1:47831 or close the other TND Studio window.':err.message);process.exitCode=1;});
server.listen(47831,'127.0.0.1',()=>console.log('TND Studio: http://127.0.0.1:47831'));
