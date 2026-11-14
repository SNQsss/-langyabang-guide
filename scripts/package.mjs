import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {deflateRawSync} from 'node:zlib';
import {build} from './build.mjs';
import {check} from './check.mjs';
import {within} from './lib.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(data){let crc=0xffffffff;for(const byte of data)crc=table[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
async function filesIn(directory,prefix='') {
  const result=[];
  for(const ent of await fs.readdir(directory,{withFileTypes:true})){
    const rel=prefix?`${prefix}/${ent.name}`:ent.name;
    if(ent.isDirectory())result.push(...await filesIn(path.join(directory,ent.name),rel));
    else if(ent.isFile())result.push(rel);
  }
  return result;
}
async function zip(files,destination) {
  const local=[],central=[];let offset=0;
  const now=new Date(),dosDate=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
  for(const [name,data] of files) {
    const filename=Buffer.from(name,'utf8'),compressed=deflateRawSync(data),crc=crc32(data);
    const head=Buffer.alloc(30);head.writeUInt32LE(0x04034b50);head.writeUInt16LE(20,4);head.writeUInt16LE(0x800,6);head.writeUInt16LE(8,8);head.writeUInt16LE(dosDate,12);head.writeUInt32LE(crc,14);head.writeUInt32LE(compressed.length,18);head.writeUInt32LE(data.length,22);head.writeUInt16LE(filename.length,26);
    local.push(head,filename,compressed);
    const dir=Buffer.alloc(46);dir.writeUInt32LE(0x02014b50);dir.writeUInt16LE(20,4);dir.writeUInt16LE(20,6);dir.writeUInt16LE(0x800,8);dir.writeUInt16LE(8,10);dir.writeUInt16LE(dosDate,14);dir.writeUInt32LE(crc,16);dir.writeUInt32LE(compressed.length,20);dir.writeUInt32LE(data.length,24);dir.writeUInt16LE(filename.length,28);dir.writeUInt32LE(offset,42);central.push(dir,filename);
    offset+=head.length+filename.length+compressed.length;
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  await fs.writeFile(destination,Buffer.concat([...local,directory,end]));
}
await build(root);await check(root);
const selected=['AGENTS.md','README.md','index.html','.gitignore','.nojekyll'];
for(const dir of ['docs','templates','content','web','scripts','人物圖片','site'])for(const relative of await filesIn(path.join(root,dir)))selected.push(`${dir}/${relative}`);
if(selected.some(f=>f.startsWith('琅琊榜_RAG文本/')||f.endsWith('.txt')))throw new Error('打包清單意外包含原始全文');
const folder=within(root,'交付/GitHub上傳包');await fs.mkdir(folder,{recursive:true});
const priorManifest=path.join(folder,'.package-files.json');
try {
  for(const old of JSON.parse(await fs.readFile(priorManifest,'utf8')))if(!selected.includes(old))await fs.unlink(within(folder,old)).catch(e=>{if(e.code!=='ENOENT')throw e;});
}catch(e){if(e.code!=='ENOENT')throw e;}
const entries=[];
for(const file of selected.sort()){
  const data=await fs.readFile(within(root,file)),target=within(folder,file);
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,data);entries.push([file,data]);
}
await fs.writeFile(priorManifest,JSON.stringify(selected,null,2));
const archive=within(root,'交付/瑯琊榜人物誌_GitHub上傳包.zip');await zip(entries,archive);
console.log('上傳包已產生：'+JSON.stringify({files:entries.length,archive,rawNovelIncluded:false}));
