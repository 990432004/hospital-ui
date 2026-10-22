const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=path.resolve(root,'../../full-version/src/plugins/iconify/icons.css');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):/\.(vue|js)$/.test(e.name)?[path.join(dir,e.name)]:[])}
const names=new Set(walk(path.join(root,'src')).flatMap(f=>fs.readFileSync(f,'utf8').match(/(?:tabler|custom)-[a-z0-9-]+/g)||[]));
const css=fs.readFileSync(source,'utf8'),rules=[];
for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){const selectors=match[1].trim().split(',').map(s=>s.trim()).filter(s=>names.has(s.replace(/^\./,'')));if(selectors.length)rules.push(selectors.join(', ')+ ' {'+match[2]+'}')}
fs.writeFileSync(path.join(root,'src/styles/icons.css'),rules.join('\n\n')+'\n');console.log(`Kept ${names.size} referenced icons, ${rules.length} rules`);
