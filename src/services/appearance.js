export const defaultAppearance = Object.freeze({
  theme:'system',lightPrimary:'#7367F0',darkPrimary:'#7367F0',skin:'default',semiDark:false,layout:'vertical',content:'compact',direction:'ltr',
})
const key='hospital-ui:appearance:v1'
const enums={theme:['system','light','dark'],skin:['default','bordered'],layout:['vertical','collapsed','horizontal'],content:['compact','wide'],direction:['ltr','rtl']}
export function readAppearance(storage) {
  const value={...defaultAppearance}
  try {
    const raw=storage.getItem(key)
    if(!raw){const legacy=storage.getItem('hospital-ui:theme');if(enums.theme.includes(legacy))value.theme=legacy;return value}
    const saved=JSON.parse(raw)
    if(!saved||typeof saved!=='object'||Array.isArray(saved))return value
    for(const [name,options] of Object.entries(enums))if(options.includes(saved[name]))value[name]=saved[name]
    for(const name of ['lightPrimary','darkPrimary'])if(/^#[0-9a-f]{6}$/i.test(saved[name]||''))value[name]=saved[name]
    if(typeof saved.semiDark==='boolean')value.semiDark=saved.semiDark
  } catch { /* Appearance errors may safely fall back; business data is separate. */ }
  return value
}
export function saveAppearance(storage,value){storage.setItem(key,JSON.stringify(value))}
