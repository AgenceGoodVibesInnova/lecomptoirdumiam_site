const http=require("http"),fs=require("fs"),path=require("path");
const root="tests/.local/appdist";
http.createServer((req,res)=>{let u=decodeURIComponent(req.url.split("?")[0]);if(!u.startsWith("/app")){res.writeHead(302,{location:"/app"});return res.end();}
let f=path.join(root,u.slice(4)||"/");if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,"index.html");
const t={".js":"text/javascript",".html":"text/html",".ttf":"font/ttf",".png":"image/png",".ico":"image/x-icon"}[path.extname(f)]||"application/octet-stream";
res.writeHead(200,{"content-type":t});fs.createReadStream(f).pipe(res);}).listen(8081,"127.0.0.1");
