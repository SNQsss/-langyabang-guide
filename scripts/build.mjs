import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadProject, escapeHtml as e, markdown, exists, within} from './lib.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function build(root = projectRoot, output = path.join(root, 'site')) {
  const data = await loadProject(root);
  const {renderHome, renderCharacter, renderEvent, shell} = await import('../web/layout.mjs');
  const published = data.articles.filter(a => a.meta.status === 'published');
  const files = new Map();
  const detail = new Map(published.filter(a => a.meta.type === 'character').map(a => [a.meta.id, a]));
  const context = {...data, published, detail, e, markdown};
  files.set('index.html', shell({title:'瑯琊榜人物誌｜角色與故事事件', description:'以小說文字為起點，認識梅長蘇與金陵眾人，循著人物走進故事。', prefix:'', page:'home', content:renderHome(context)}));
  for (const article of published) {
    const type = article.meta.type === 'character' ? 'characters' : 'events';
    const title = article.meta.type === 'event' ? '故事事件｜瑯琊榜人物誌' : `${article.meta.title}｜瑯琊榜人物誌`;
    const description = article.meta.type === 'event' ? '選擇開啟劇透後，閱讀小說故事事件的背景、經過與結果。' : article.meta.summary;
    files.set(`${type}/${article.meta.id}.html`, shell({title, description, prefix:'../', page:article.meta.type, spoilerTitle:`${article.meta.title}｜瑯琊榜人物誌`, content:article.meta.type === 'character' ? renderCharacter(article, context) : renderEvent(article, context)}));
  }
  for (const file of ['styles.css','app.js','favicon.svg']) files.set(`assets/${file}`, await fs.readFile(path.join(root, 'web', file)));
  for (const c of data.characters) {
    const ext = path.extname(c.image).toLowerCase();
    files.set(`assets/portraits/${c.id}${ext}`, await fs.readFile(within(root, `人物圖片/${c.image}`)));
  }
  await fs.mkdir(output, {recursive:true});
  const manifestFile = path.join(output, 'generated-files.json');
  if (await exists(manifestFile)) {
    const previous = JSON.parse(await fs.readFile(manifestFile, 'utf8'));
    for (const file of previous) if (!files.has(file) && /^[a-zA-Z0-9/_.-]+$/.test(file)) {
      const target = within(output, file);
      if (await exists(target)) await fs.unlink(target);
    }
  }
  for (const [relative, content] of files) {
    const file = within(output, relative);
    await fs.mkdir(path.dirname(file), {recursive:true});
    await fs.writeFile(file, content);
  }
  await fs.writeFile(manifestFile, JSON.stringify([...files.keys()].sort(), null, 2) + '\n');
  return {pages:[...files.keys()].filter(f => f.endsWith('.html')), files:files.size, characters:data.characters.length};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log('網站建置完成：' + JSON.stringify(await build())); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
