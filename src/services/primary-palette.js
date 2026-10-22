// Solid primary surfaces use white labels consistently. Very light selections
// are darkened in the same hue; accent/tonal colors retain the chosen value.
export function primaryPalette(color) {
  if(!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Invalid primary color')
  let channels=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16))
  const luminance=()=>channels.map(n=>n/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0)
  while(1.05/(luminance()+.05)<4.5)channels=channels.map(c=>Math.floor(c*.96))
  return {primary:color,'on-primary':'#ffffff','primary-solid':'#'+channels.map(c=>c.toString(16).padStart(2,'0')).join(''),'on-primary-solid':'#ffffff'}
}
