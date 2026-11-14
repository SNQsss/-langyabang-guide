import fs from 'node:fs/promises';
import path from 'node:path';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function json(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }
export async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }
export function within(root, relative) {
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(path.resolve(root) + path.sep)) throw new Error(`路徑超出專案：${relative}`);
  return resolved;
}
export function parseArticle(text, filename) {
  const match = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${filename} 缺少 JSON 頁首資料`);
  const meta = JSON.parse(match[1]);
  if (meta.id !== path.basename(filename, '.md')) throw new Error(`${filename} 的 id 與檔名不符`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.id)) throw new Error(`不合法代號：${meta.id}`);
  if (!['character', 'event'].includes(meta.type) || !['draft', 'published'].includes(meta.status)) throw new Error(`${filename} 的類型或狀態無效`);
  for (const key of ['title', 'summary', 'sources', 'relatedCharacters']) if (!meta[key]) throw new Error(`${filename} 缺少 ${key}`);
  if (!Array.isArray(meta.sources) || !meta.sources.length || !Array.isArray(meta.relatedCharacters)) throw new Error(`${filename} 的來源與人物欄位格式錯誤`);
  const body = match[2].trim();
  if (!body) throw new Error(`${filename} 沒有正文`);
  if (meta.type === 'character' && (!body.includes('## 不劇透介紹\n') || !body.includes('## 劇透介紹\n'))) throw new Error(`${filename} 缺少兩種介紹區段`);
  if (meta.type === 'event') for (const h of ['事件概述', '背景', '主要經過', '直接結果']) if (!body.includes(`## ${h}\n`)) throw new Error(`${filename} 缺少「${h}」`);
  return {meta, body, filename};
}
export async function loadProject(root) {
  const characters = await json(path.join(root, 'content/characters.json'));
  const sources = await json(path.join(root, 'content/sources.json'));
  const articles = [];
  for (const [dir, type] of [['characters','character'],['events','event']]) {
    for (const file of (await fs.readdir(path.join(root, 'content', dir))).filter(f => f.endsWith('.md')).sort()) {
      const article = parseArticle(await fs.readFile(path.join(root, 'content', dir, file), 'utf8'), file);
      if (article.meta.type !== type) throw new Error(`${file} 放錯內容目錄`);
      articles.push(article);
    }
  }
  const ids = new Set();
  for (const c of characters) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.id) || ids.has(c.id)) throw new Error(`重複或無效角色代號：${c.id}`);
    ids.add(c.id);
    for (const field of ['name','label','summary','image','sources']) if (!c[field]) throw new Error(`${c.id} 缺少 ${field}`);
    if (!await exists(within(root, `人物圖片/${c.image}`))) throw new Error(`找不到圖片：${c.image}`);
    for (const id of c.sources) if (!sources[id] || sources[id].spoiler) throw new Error(`${c.id} 的基本介紹來源不存在或含劇透：${id}`);
  }
  const articleIds = new Set();
  for (const {meta,body} of articles) {
    const key = `${meta.type}/${meta.id}`;
    if (articleIds.has(key)) throw new Error(`重複文章：${key}`);
    articleIds.add(key);
    if (meta.type === 'character' && !ids.has(meta.id)) throw new Error(`${meta.id} 未登錄於人物總覽`);
    for (const id of meta.relatedCharacters) if (!ids.has(id)) throw new Error(`${meta.id} 的相關人物不存在：${id}`);
    for (const id of meta.sources) if (!sources[id]) throw new Error(`${meta.id} 的來源不存在：${id}`);
    for (const match of body.matchAll(/\]\(#source-([A-Za-z0-9]+)\)/g)) if (!meta.sources.includes(match[1])) throw new Error(`${meta.id} 引用未登錄來源：${match[1]}`);
    if (meta.type === 'event' && (!meta.coverCharacter || !ids.has(meta.coverCharacter))) throw new Error(`${meta.id} 缺少有效封面角色`);
    if (meta.type === 'event' && (!Array.isArray(meta.timeline) || !meta.timeline.length)) throw new Error(`${meta.id} 缺少事件脈絡列表`);
  }
  return {characters, sources, articles};
}
export function markdown(text) {
  const inline = text => {
    const escaped = escapeHtml(text);
    return escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      if (!/^(#[A-Za-z0-9-]+|(?:\.\.\/)?(?:characters|events)\/[a-z0-9-]+\.html)$/.test(href)) throw new Error(`不支援的文章連結：${href}`);
      return `<a href="${href}">${label}</a>`;
    }).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  };
  const lines = text.trim().split('\n');
  let out = '', paragraph = [], list = false;
  const flush = () => { if (paragraph.length) { out += `<p>${inline(paragraph.join(' '))}</p>\n`; paragraph = []; } if (list) { out += '</ul>\n'; list = false; } };
  for (const line of lines) {
    if (!line.trim()) { flush(); continue; }
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) { flush(); const level = heading[1].length; out += `<h${level}>${inline(heading[2])}</h${level}>\n`; }
    else if (line.startsWith('- ')) { if (paragraph.length) flush(); if (!list) { out += '<ul>\n'; list = true; } out += `<li>${inline(line.slice(2))}</li>\n`; }
    else { if (list) flush(); paragraph.push(line); }
  }
  flush(); return out;
}
