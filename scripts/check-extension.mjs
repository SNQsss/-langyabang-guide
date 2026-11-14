import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {build} from './build.mjs';
import {check} from './check.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'langya-extension-'));
function articleText(text,id,type) {
  let next=text.replace(/new-character/g,id).replace(/new-event/g,id).replace('"draft"','"published"');
  if(type==='character') next=next.replaceAll('SAFE01','C01').replaceAll('SPOILER01','M04');
  else next=next.replaceAll('EVENT01','E01');
  return next;
}
try {
  for(const dir of ['content','人物圖片','web']) await fs.cp(path.join(root,dir),path.join(temp,dir),{recursive:true});
  const chars=JSON.parse(await fs.readFile(path.join(temp,'content/characters.json'),'utf8'));
  chars.push({...chars[0],id:'validation-character',name:'範本驗證人物',label:'僅驗證用'});
  await fs.writeFile(path.join(temp,'content/characters.json'),JSON.stringify(chars,null,2));
  await fs.writeFile(path.join(temp,'content/characters/validation-character.md'),articleText(await fs.readFile(path.join(root,'templates/character.md'),'utf8'),'validation-character','character'));
  await fs.writeFile(path.join(temp,'content/events/validation-event.md'),articleText(await fs.readFile(path.join(root,'templates/event.md'),'utf8'),'validation-event','event'));
  await build(temp);
  const first=await check(temp);
  const home=await fs.readFile(path.join(temp,'site/index.html'),'utf8');
  if(!home.includes('characters/validation-character.html')||!home.includes('events/validation-event.html')) throw new Error('新增內容未自動加入首頁');
  // Reverting to draft must remove a previously generated page and its navigation.
  for(const relative of ['characters/validation-character.md','events/validation-event.md']) {
    const file=path.join(temp,'content',relative);
    await fs.writeFile(file,(await fs.readFile(file,'utf8')).replace('"published"','"draft"'));
  }
  await build(temp);
  const second=await check(temp);
  const nextHome=await fs.readFile(path.join(temp,'site/index.html'),'utf8');
  if(nextHome.includes('characters/validation-character.html')||nextHome.includes('events/validation-event.html')) throw new Error('草稿仍出現公開入口');
  for(const relative of ['characters/validation-character.html','events/validation-event.html']) {
    try {await fs.access(path.join(temp,'site',relative));throw new Error(`草稿頁未移除：${relative}`);} catch(error){if(error.code!=='ENOENT')throw error;}
  }
  console.log('延伸流程驗證通過：'+JSON.stringify({新增後頁數:first.pages,改回草稿後頁數:second.pages,新增人物卡片:first.characters,正式專案未加入測試資料:true}));
} catch(error){console.error(error.stack);process.exitCode=1;}
finally {
  const absolute=path.resolve(temp),base=path.resolve(os.tmpdir());
  if(path.dirname(absolute)!==base||!path.basename(absolute).startsWith('langya-extension-')) throw new Error('拒絕清除非本次暫存目錄');
  await fs.rm(absolute,{recursive:true,force:true});
}
