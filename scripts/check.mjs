import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {exists, loadProject, within} from './lib.mjs';

export async function check(root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  const {characters,sources,articles}=await loadProject(root);
  const out=path.join(root,'site');
  const manifest=JSON.parse(await fs.readFile(path.join(out,'generated-files.json'),'utf8'));
  const pages=manifest.filter(f=>f.endsWith('.html'));
  const cache=new Map();
  for(const page of pages) cache.set(page,await fs.readFile(within(out,page),'utf8'));
  let linkCount=0, paragraphCount=0;
  for(const [page,html] of cache) {
    if (!html.includes('lang="zh-Hant-TW"')) throw new Error(`${page} 語系缺失`);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    if(new Set(ids).size!==ids.length) throw new Error(`${page} 有重複的頁面錨點`);
    for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const link=m[1].replace(/&amp;/g,'&');
      if(/^(https?:|mailto:|data:)/.test(link)) continue;
      if(link.startsWith('/') || /^[A-Za-z]:/.test(link)) throw new Error(`${page} 含非相對路徑：${link}`);
      const [relative,anchor]=link.split('#');
      const target=relative?path.posix.normalize(path.posix.join(path.posix.dirname(page),decodeURIComponent(relative))):page;
      if(!await exists(within(out,target))) throw new Error(`${page} 找不到連結：${link}`);
      if(anchor && target.endsWith('.html')) {
        const text=cache.get(target)||await fs.readFile(within(out,target),'utf8');
        if(!text.includes(`id="${anchor}"`)) throw new Error(`${page} 的錨點不存在：${link}`);
      }
      linkCount++;
    }
    if(/<img\b[^>]*alt=""/.test(html)) throw new Error(`${page} 有缺少人物說明的圖片`);
  }
  const raw=path.join(root,'琅琊榜_RAG文本');
  const sourceAvailable=await exists(raw);
  const rawCache=new Map();
  for(const [id,s] of Object.entries(sources)) {
    if(!s.file||!s.chapter||!s.title||!s.note||!Array.isArray(s.paragraphs)||!s.paragraphs.length||typeof s.spoiler!=='boolean') throw new Error(`${id} 來源欄位不完整`);
    for(const p of s.paragraphs) if(!/^C\d{3}-P\d{4}$/.test(p)) throw new Error(`${id} 段落格式不正確：${p}`);
    if(sourceAvailable) {
      if(!rawCache.has(s.file)) rawCache.set(s.file,await fs.readFile(within(raw,s.file),'utf8'));
      const text=rawCache.get(s.file);
      if(!text.includes(`原文章號：${s.chapter}`)||!text.includes(`章名：${s.title}`)) throw new Error(`${id} 章名與原檔不符`);
      for(const p of s.paragraphs) {if(!text.includes(`段落編號：${p}`)) throw new Error(`${id} 原文段落不存在：${p}`);paragraphCount++;}
    }
  }
  for(const {meta,body} of articles) if(meta.status==='published') {
    if(meta.type==='character') {
      const safe=body.split('## 劇透介紹')[0];
      if(/林殊|赤焰少帥|冰續丹/.test(safe)) throw new Error(`${meta.id} 不劇透介紹含重大揭露`);
      for(const m of safe.matchAll(/\]\(#source-([A-Za-z0-9]+)\)/g)) if(sources[m[1]].spoiler) throw new Error(`${meta.id} 基本版引用劇透來源`);
      const full=body.split('## 劇透介紹')[1];
      for(const m of full.matchAll(/\]\(#source-([A-Za-z0-9]+)\)/g)) if(!sources[m[1]].spoiler) throw new Error(`${meta.id} 劇透版來源需另登錄於劇透來源群組`);
    }
    if(meta.type==='event' && (!Array.isArray(meta.timeline)||!meta.timeline.length)) throw new Error(`${meta.id} 缺少事件脈絡列表`);
  }
  return {pages:pages.length,characters:characters.length,linksAndAssets:linkCount,sourceGroups:Object.keys(sources).length,rawParagraphReferences:sourceAvailable?paragraphCount:'原文未隨公開包附上；略過本機段落存在檢查'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {console.log('檢查通過：'+JSON.stringify(await check()));} catch(error){console.error(error.message);process.exitCode=1;}
}
