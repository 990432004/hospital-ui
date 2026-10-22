import {test} from 'node:test'
import assert from 'node:assert/strict'
import GanttEngine from '../src/services/gantt-engine.js'
class Surface extends EventTarget{style={};width=0;height=0;removed=false;listeners=new Map();addEventListener(name,fn,opts){super.addEventListener(name,fn,opts);this.listeners.set(name,(this.listeners.get(name)||0)+1)}removeEventListener(name,fn,opts){super.removeEventListener(name,fn,opts);this.listeners.set(name,this.listeners.get(name)-1)}getContext(){return {setTransform(){}}}getBoundingClientRect(){return {left:0,top:0,width:1000,height:500}}appendChild(canvas){this.child=canvas}remove(){this.removed=true}setAttribute(){}focus(){this.focused=true}}
const documentSurface=new Surface()
globalThis.document=documentSurface;document.createElement=()=>new Surface();globalThis.window={devicePixelRatio:1};globalThis.ResizeObserver=class {observe(){}disconnect(){this.disconnected=true}};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};globalThis.CustomEvent=class extends Event{constructor(name,{detail}){super(name);this.detail=detail}}
const makeEngine=()=>new GanttEngine(new Surface())
test('引擎销毁释放全部平台与订阅事件，避免离开页面后响应键盘',()=>{const engine=makeEngine(),canvas=engine.canvas;let selected=0;engine.on('select',()=>selected++);engine.destroy();engine.container.dispatchEvent(new CustomEvent('gantt:select',{detail:{}}));assert.equal(selected,0);assert.equal(documentSurface.listeners.get('keydown')||0,0);assert.equal([...canvas.listeners.values()].reduce((a,b)=>a+b,0),0);assert.equal(canvas.removed,true);assert.equal(engine.resizeObserver.disconnected,true)})
test('设备排程仍按原手术ID关联临床节点',()=>{const engine=makeEngine();engine.setViewDate('2026-10-21');engine.setData([{id:'EQ-1',sourceSurgeryId:'OP-1',name:'手术',equipment:'设备',planStart:'09:00',planEnd:'11:00',_raw:{id:'OP-1'}}],'equipment');engine.setTimelineEvents([{id:'T1',surgeryId:'OP-1',nodeCode:'T1',nodeName:'入室',category:'入室',plannedTime:'09:00',actualTime:'09:00'}]);assert.equal(engine._buildSubTasks(engine.groups[0]).length,1);engine.destroy()})
test('拖动平移后的click不会误开手术详情',()=>{const engine=makeEngine();engine.mouseX=200;engine.mouseY=100;engine._onMouseDown({button:0,clientX:200,clientY:100});engine._onMouseMove({clientX:260,clientY:100});engine._onMouseUp({});let hits=0;engine._hitTest=()=>{hits++;return {id:'op'}};engine._onClick({clientX:260,clientY:100});assert.equal(hits,0);engine.destroy()})
test('完整场景六视图、分组展开和悬浮提示均可渲染，资源数量与原始目录一致',async()=>{
 const {readFile}=await import('node:fs/promises'),{createGanttData,GANTT_VIEWS}=await import('../src/services/gantt-model.js'),scenario=JSON.parse(await readFile(new URL('../public/data/scenario.json',import.meta.url),'utf8'))
 const geometry=['moveTo','lineTo','rect','fillRect','strokeRect','arc','quadraticCurveTo','bezierCurveTo'],texts=[]
 for(const {value:view} of GANTT_VIEWS){
  const engine=makeEngine(),data=createGanttData(scenario,scenario.surgeries,view,scenario.meta.date)
  engine.ctx=new Proxy({canvas:engine.canvas,measureText:text=>({width:String(text).length*7}),createLinearGradient:()=>({addColorStop(){}}),fillText:text=>texts.push(String(text))},{get:(target,key)=>key in target?target[key]:geometry.includes(key)?(...args)=>{for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),view+' '+key)}:()=>{}})
  engine.setViewDate(scenario.meta.date);engine.setData(data.rows,view,data.groupCatalog);engine.setTimelineEvents(data.timelineEvents);engine.setEventMarkers(data.markers);engine.render()
  if(view==='equipment')assert.equal(engine.groups.length,scenario.equipment.filter(e=>e.isCritical).length)
  if(view==='pacu')assert.equal(engine.groups.length,scenario.pacuBeds.length)
  const group=engine.groups.find(g=>g.surgeries.length);engine.expandedGroup=group.name;engine.subTasks=engine._buildSubTasks(group);engine._rebuildGroupRowMap();engine.selectSurgery(group.surgeries[0].id);engine.render()
  engine.hoveredSurgery=group.surgeries[0];engine.render()
  const node=engine.timelineEvents.find(e=>e.surgeryId===group.surgeries[0].sourceSurgeryId);if(node){engine.hoveredTimelineNode=node;engine.render()}
  engine.destroy()
 }
 for(const label of ['术前准备','术中','术后复苏','计划','实际'])assert.ok(texts.includes(label),'导出画布包含图例 '+label);assert.ok(texts.some(text=>text.includes('计划:')));assert.ok(texts.some(text=>text.includes('类别:')))
})

test('点击空白统一清除手术并广播同一个选中时点',()=>{const engine=makeEngine();engine.setViewDate('2026-10-21');let selection='stale',time;engine.on('select',e=>selection=e.detail.surgery);engine.on('timeSelect',e=>time=e.detail.time);engine._onClick({clientX:400,clientY:200});assert.equal(selection,null);assert.ok(time instanceof Date);engine.destroy()})
test('Escape取消手术但保留复盘时间；视图刷新能单独清除旧时间线',()=>{const engine=makeEngine();let selection='stale',time='stale';engine.on('select',e=>selection=e.detail.surgery);engine.on('timeSelect',e=>time=e.detail.time);engine.selectedSurgery={id:'OP1'};engine.selectedTime=new Date('2026-10-21T10:00:00');engine._onKeyDown({key:'Escape',preventDefault(){}});assert.equal(selection,null);assert.equal(time.getTime(),new Date('2026-10-21T10:00:00').getTime());engine.selectedTime=new Date();engine.clearSelectedTime();assert.equal(engine.selectedTime,null);engine.destroy()})

test('整点刻度与条带共用时间数值，缩放平移后10:46仍在10点和11点之间',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');
 for(const [scale,offset] of [[1,0],[1.7,-183],[.5,-37]]){
  engine.scale=scale;engine.offsetX=offset;
  const labels=[],ctx=new Proxy({fillText:(text,x)=>labels.push({text,x})},{get:(t,k)=>k in t?t[k]:()=>{}});
  engine._renderTimeHeader(ctx,1000);
  for(const {text,x} of labels.filter(l=>/^\d\d:\d\d$/.test(l.text))){
   const [h,m]=text.split(':').map(Number),time=new Date('2026-10-21T00:00:00');time.setHours(h,m);
   assert.ok(Math.abs(engine._timeToX(time)-x)<.001,`${text}标签偏离实际数值坐标`);
  }
 }
 engine.destroy();
})
test('五个资源视图分别绘制数值驱动的计划与实际条，偏移区域位于条带之下',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');
 for(const view of ['room','doctor','nurse','equipment','pacu']){
  engine.setData([{id:'early',name:'胃大部切除术',room:'A',doctor:'A',nurse:'A',equipment:'A',pacuBedNo:'A',planStart:'10:46',planEnd:'13:24',actualStart:'10:29',actualEnd:'12:37'}],view);
  const draws=[];engine._renderPlanBar=(c,x,y,w)=>draws.push({type:'plan',x,y,w});engine._renderActualBar=(c,x,y,w)=>draws.push({type:'actual',x,y,w});engine._renderDeviation=()=>draws.push({type:'deviation'});
  engine._renderSurgeryBars({},1000,500);
  assert.deepEqual(draws.map(x=>x.type),['deviation','plan','actual']);
  const [,plan,actual]=draws,px=engine.options.PIXELS_PER_HOUR/60;
  assert.ok(plan.y<actual.y);assert.ok(Math.abs(plan.w-158*px)<.001);assert.ok(Math.abs(actual.w-128*px)<.001);assert.ok(Math.abs((plan.x-actual.x)-17*px)<.001);
 }
 engine.destroy();
})
test('提前与延时按开始、结束独立计算，不再相加且混合偏移不抵消',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');
 for(const [actualStart,actualEnd,startLabel,endLabel] of [['10:29','12:37','开始提前 17 分钟','结束提前 47 分钟'],['10:56','13:14','开始延时 10 分钟','结束提前 10 分钟']]){
  engine.setData([{id:'OP',planStart:'10:46',planEnd:'13:24',actualStart,actualEnd}],'nurse');engine.hoveredSurgery=engine.data[0];
  const texts=[],ctx=new Proxy({measureText:t=>({width:t.length*7}),fillText:t=>texts.push(t)},{get:(t,k)=>k in t?t[k]:()=>{}});engine._renderTooltip(ctx);
  assert.ok(texts.includes(startLabel),texts.join(','));assert.ok(texts.includes(endLabel));assert.ok(!texts.some(t=>t.includes('-64')));
 }
 engine.destroy();
})
test('实际条超出计划的提前与延时部分都能选中，计划和实际分别命中',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');engine.setData([{id:'OP',room:'A',planStart:'10:46',planEnd:'13:24',actualStart:'10:29',actualEnd:'13:40'}],'room');
 const y=engine.options.HEADER_HEIGHT,at=t=>engine._timeToX(new Date('2026-10-21T'+t+':00'));
 assert.equal(engine._hitTest(at('10:35'),y+38)?.id,'OP');assert.equal(engine._hitTest(at('13:35'),y+38)?.id,'OP');assert.equal(engine._hitTest(at('10:35'),y+12),null);engine.destroy();
})

test('开始提前、结束延时分别以绿红补齐上下两层，进行中只比较开始',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');engine.setData([{id:'OP',room:'A',planStart:'10:00',planEnd:'11:00',actualStart:'09:50',actualEnd:'11:20'}],'room');
 const fills=[],ctx=new Proxy({fillRect:(x,y,w,h)=>fills.push({x,y,w,h,color:ctx.fillStyle}),measureText:t=>({width:t.length*7})},{get:(t,k)=>k in t?t[k]:()=>{}});
 const s=engine.data[0],px=engine.options.PIXELS_PER_HOUR/60;
 engine._renderDeviation(ctx,s,engine._timeToX(s.planStart),60*px,engine._timeToX(s.actualStart),90*px,50);
 assert.equal(fills.length,2);assert.ok(fills[0].color.includes('16, 185, 129'));assert.ok(fills[1].color.includes('239, 68, 68'));assert.ok(Math.abs(fills[0].w-10*px)<.001);assert.ok(Math.abs(fills[1].w-20*px)<.001);assert.equal(fills[0].h,engine.options.TIME_BAR_HEIGHT*2+3);
 engine.setData([{id:'OP',room:'A',planStart:'10:00',planEnd:'11:00',actualStart:'09:50',actualProgressEnd:'10:30'}],'room');
 let actualWidth=null;engine._renderActualBar=(ctx,x,y,w)=>actualWidth=w;engine._renderPlanBar=()=>{};fills.length=0;engine._renderSurgeryBars(ctx,1000,500);
 assert.ok(Math.abs(actualWidth-40*px)<.001);assert.equal(fills.length,1);engine.destroy();
})

test('资源节点固定在实际条带中线，排除时段外节点且不向相邻行绘制代码标签',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');
 for(const view of ['room','doctor','nurse','equipment','pacu']){
  engine.setData([{id:'OP',sourceSurgeryId:'OP',room:'A',doctor:'A',nurse:'A',equipment:'A',pacuBedNo:'A',planStart:'13:30',planEnd:'17:22',actualStart:'13:43',actualProgressEnd:'14:00'}],view);
  engine.setTimelineEvents([{id:'before',surgeryId:'OP',nodeCode:'P1',actualTime:'12:30'}, {id:'inside',surgeryId:'OP',nodeCode:'T3',actualTime:'13:50'}, {id:'future',surgeryId:'OP',nodeCode:'T4',actualTime:'14:05'}]);engine.selectSurgery('OP');
  const marks=[],texts=[],ctx=new Proxy({fillText:t=>texts.push(t)},{get:(t,k)=>k in t?t[k]:()=>{}});engine._drawNodeShape=(ctx,shape,x,y,size)=>marks.push({x,y,size});
  engine._renderTimelineNodes(ctx,engine.data[0],0,44,1000);
  assert.equal(marks.length,1);assert.equal(marks[0].y,84.5);assert.equal(marks[0].x,engine._timeToX(engine.timelineEvents[1].actualTime));assert.ok(!texts.includes('T3'));
  assert.equal(engine._hitTestTimelineNode(marks[0].x,marks[0].y)?.id,'inside');assert.equal(engine._hitTestTimelineNode(marks[0].x,34),null);
 }
 engine.destroy();
})
test('密集节点在实际条带内聚合，悬停保留全部节点及时间，放大后可分开',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');engine.setData([{id:'OP',room:'A',planStart:'09:00',planEnd:'11:00',actualStart:'09:00',actualEnd:'11:00'}],'room');engine.selectSurgery('OP');
 engine.setTimelineEvents(['09:30','09:32','09:50'].map((actualTime,i)=>({id:'N'+i,surgeryId:'OP',nodeCode:'T'+i,nodeName:'节点'+i,actualTime,plannedTime:actualTime,category:'手术'})));
 const texts=[],ctx=new Proxy({fillText:t=>texts.push(t),measureText:t=>({width:t.length*7})},{get:(t,k)=>k in t?t[k]:()=>{}});
 engine._renderTimelineNodes(ctx,engine.data[0],0,44,1000);
 assert.ok(texts.includes('2'));const x=engine._timeToX(engine.timelineEvents[0].actualTime),hit=engine._hitTestTimelineNode(x,84.5);
 assert.deepEqual(hit.nodes.map(n=>n.id),['N0','N1']);engine.hoveredTimelineNode=hit;engine._renderNodeTooltip(ctx);assert.ok(texts.some(t=>t.includes('09:32')&&t.includes('节点1')));
 engine.scale=8;engine.offsetX=-1500;const separated=engine._hitTestTimelineNode(engine._timeToX(engine.timelineEvents[1].actualTime),84.5);assert.equal(separated.id,'N1');assert.equal(separated.nodes,undefined);
 engine.destroy();
})

test('点击实际条端点的节点标记边缘不会清除选中手术',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');engine.setData([{id:'OP',room:'A',planStart:'13:30',planEnd:'17:22',actualStart:'13:43',actualProgressEnd:'14:00'}],'room');engine.selectSurgery('OP');
 engine.setTimelineEvents([{id:'N',surgeryId:'OP',nodeCode:'T3',actualTime:'13:43'}]);
 const x=engine._timeToX(engine.timelineEvents[0].actualTime);engine._onClick({clientX:x-2,clientY:84.5});assert.equal(engine.getSelected()?.id,'OP');engine.destroy();
})

test('患者展开按五阶段排序，缺少术后转运时间保留空行而不造时段',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');
 engine.setData([{id:'OP',patient:'患者',name:'手术',planStart:'09:00',planEnd:'10:00'}],'patient');
 engine.setTimelineEvents([['P1','07:00'],['P7','08:30'],['T1','09:00'],['T8','10:00'],['T17','10:00'],['T18','11:00']].map(([nodeCode,actualTime])=>({id:nodeCode,surgeryId:'OP',nodeCode,actualTime,plannedTime:actualTime})));
 const phases=engine._buildSubTasks(engine.groups[0]);
 assert.deepEqual(phases.map(p=>p.category),['术前准备','术前转运','手术进行','复苏','术后转运']);
 assert.equal((phases[1].actualEnd-phases[1].actualStart)/60000,30);
 assert.equal(phases[4].actualStart,null);assert.equal(phases[4].actualEnd,null);
 engine.destroy();
})

test('同一患者多台手术分行展示，展开后的坐标与第二台手术点击对应',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');
 engine.setData(['A','B'].map(id=>({id,patient:'患者',name:'手术'+id,planStart:'09:00',planEnd:'10:00',actualStart:'09:00',actualEnd:'10:00'})),'patient');
 const ctx=new Proxy({measureText:t=>({width:t.length*7})},{get:(t,k)=>k in t?t[k]:()=>{}});
 for(const surgery of engine.data)engine._renderPatientJourney(ctx,surgery,engine.options.HEADER_HEIGHT,1000);
 const [first,second]=engine.data,x=engine._timeToX(second.actualStart)+10,y=engine._patientBarY(second)+14;
 assert.equal(engine._patientBarY(second)-engine._patientBarY(first),28);
 const rowTop=engine._rowToY(first._rowIndex),rowBottom=rowTop+engine._mainRowHeight(first._rowIndex);
 assert.equal(engine._patientBarY(first)-rowTop,rowBottom-engine._patientBarY(second)-28,'多台手术上下留白相等');
 assert.equal(engine._yToRow(y),second._rowIndex);
 engine._onClick({clientX:x,clientY:y});assert.equal(engine.getSelected()?.id,'B');
 engine.expandedGroup='患者';engine.subTasks=engine._buildSubTasks(engine.groups[0]);engine._rebuildGroupRowMap();
 assert.equal(engine._rowToY(1),engine.options.HEADER_HEIGHT+88);
 const phase=engine.subTasks.find(p=>p.surgeryId==='B'&&p.category==='手术进行'),row=engine._getSubTaskRowIndex(phase),subY=engine._rowToY(row)+engine.options.SUB_ROW_HEIGHT/2;
 assert.equal(engine._yToRow(subY),row);
 engine.selectedSurgery=first;engine._onClick({clientX:x,clientY:subY});assert.equal(engine.getSelected()?.id,'B');
 engine.destroy();
})

test('展开动画按进度推开后续记录，反向收起与切组均落到正确布局',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');
 engine.setData(['甲','乙','丙'].map((patient,i)=>({id:'OP'+i,patient,name:'手术',planStart:'09:00',planEnd:'10:00',actualStart:'09:00',actualEnd:'10:00'})),'patient');
 const first=engine.groups[0],second=engine.groups[1];
 const secondY=()=>engine._rowToY(second.rowIndex),closedY=secondY();
 engine._toggleGroup(first);let animation=engine._expansionAnimation;
 assert.equal(secondY(),closedY);
 engine._advanceExpansion(animation.start+animation.duration/2);
 const partialY=secondY();assert.ok(partialY>closedY&&partialY<closedY+170);
 const row=engine._yToRow(partialY+5);assert.equal(engine._getGroupAtRow(row).name,second.name);
 engine._toggleGroup(first);animation=engine._expansionAnimation;
 assert.equal(secondY(),partialY,'反向切换不跳变');
 engine._advanceExpansion(animation.start+animation.duration+1);assert.equal(engine.expandedGroup,null);assert.equal(secondY(),closedY);
 engine._toggleGroup(first);animation=engine._expansionAnimation;engine._advanceExpansion(animation.start+animation.duration+1);
 assert.equal(secondY(),closedY+170);
 engine._toggleGroup(second);animation=engine._expansionAnimation;engine._advanceExpansion(animation.start+animation.duration+1);
 assert.equal(engine.expandedGroup,second.name);animation=engine._expansionAnimation;engine._advanceExpansion(animation.start+animation.duration+1);
 assert.equal(engine._expandedProgress,1);assert.equal(engine.subTasks.length,5);engine.destroy();
})

test('主行隔色不随展开改变，子流程底板独立，名称区与时间区采用同一底色',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');engine.setData(['甲','乙','丙'].map((patient,i)=>({id:'OP'+i,patient,planStart:'09:00',planEnd:'10:00'})),'patient');
 const second=engine.groups[1],before=engine._rowBackground(second.rowIndex);
 const group=engine.groups[0];engine.expandedGroup=group.name;engine.subTasks=engine._buildSubTasks(group);engine._rebuildGroupRowMap();
 assert.equal(engine._rowBackground(second.rowIndex),before);assert.equal(engine._rowBackground(1),engine.options.COLORS.subRowBg);
 const fills=[],ctx=new Proxy({fillRect:(x,y,w,h)=>fills.push({y,h,color:ctx.fillStyle})},{get:(t,k)=>k in t?t[k]:()=>{}});
 engine._renderRowBackgrounds(ctx,0,190,500);const axis=fills.splice(0);engine._renderRowBackgrounds(ctx,190,810,500);assert.deepEqual(fills,axis);engine.destroy();
})

test('减少动态效果直接展开，重置或换视图取消未完成动画',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');const rows=[{id:'OP',patient:'患者',planStart:'09:00',planEnd:'10:00'}];engine.setData(rows,'patient');
 window.matchMedia=()=>({matches:true});engine._toggleGroup(engine.groups[0]);assert.equal(engine._expansionAnimation,null);assert.equal(engine._expandedProgress,1);
 delete window.matchMedia;engine._toggleGroup(engine.groups[0]);assert.ok(engine._expansionAnimation);engine._onDoubleClick();assert.equal(engine._expansionAnimation,null);assert.equal(engine.expandedGroup,null);
 engine._toggleGroup(engine.groups[0]);engine.setData(rows,'room');assert.equal(engine._expansionAnimation,null);assert.equal(engine.expandedGroup,null);engine.destroy();
})

test('患者阶段节点复用类别形状，并将密集节点聚合为计数圆',()=>{
 const engine=makeEngine(),shapes=[],texts=[];
 engine._timeToX=t=>Number(t);
 const nodes=[{actualTime:300,category:'手术'},{actualTime:340,category:'清点'},{actualTime:380,category:'交接'},{actualTime:420,category:'麻醉'},{actualTime:425,category:'核查'}];
 const markers=engine._phaseNodeMarkers(nodes,70,250,500);
 engine._drawNodeShape=(ctx,shape)=>shapes.push(shape);
 const ctx=new Proxy({fillText:t=>texts.push(t)},{get:(obj,key)=>obj[key]||(()=>{})});
 engine._renderNodeMarkers(ctx,markers);
 assert.deepEqual(shapes,['rect','triangle','star','circle']);
 assert.deepEqual(texts,['2']);
 assert.equal(markers[3].nodes.length,2);
 assert.ok(markers.every(m=>m.y===70));
 engine.destroy();
});

test('患者聚合悬浮不依赖选中手术，主行与子流程均返回全部节点',()=>{
 const engine=makeEngine();engine.groupBy='patient';engine.canvas.width=1000;
 const nodes=[{nodeCode:'T3',nodeName:'手术开始',actualTime:new Date('2026-10-21T09:00:00')},{nodeCode:'T12',nodeName:'安全核查',actualTime:new Date('2026-10-21T09:01:00')}];
 const marker={x:400,y:100,nodes};const surgery={_phaseRanges:[{_nodeMarkers:[marker]}]};
 engine._yToRow=()=>0;engine._isSubRow=()=>false;engine._getGroupAtRow=()=>({surgeries:[surgery]});
 for(const selected of [null,{_phaseRanges:[]}]){engine.selectedSurgery=selected;assert.deepEqual(engine._hitTestTimelineNode(400,100)?.nodes,nodes)}
 engine._isSubRow=()=>true;engine._getSubTaskAtRow=()=>({_nodeMarkers:[marker]});engine.selectedSurgery=null;
 const hit=engine._hitTestTimelineNode(400,100);assert.deepEqual(hit?.nodes,nodes);
 engine.hoveredTimelineNode=hit;let lines;engine._drawTooltip=(ctx,value)=>lines=value;engine._renderNodeTooltip({});
 assert.ok(lines.some(l=>l.text.includes('T3 手术开始')));assert.ok(lines.some(l=>l.text.includes('T12 安全核查')));
 assert.equal(engine._hitTestTimelineNode(420,100),null);engine.destroy();
});

test('节点图例独立放在旧图例右侧，窄画布避让且包含全部类别与聚合',()=>{
 const engine=makeEngine(),labels=[],boxes=[],shapes=[];
 const ctx=new Proxy({measureText:t=>({width:t.length*12}),fillText:t=>labels.push(t)},{get:(o,k)=>o[k]||(()=>{})});
 engine._roundRect=(ctx,...args)=>boxes.push(args);engine._drawNodeShape=(ctx,shape)=>shapes.push(shape);
 engine._renderNodeLegend(ctx,1200,600,360,540);
 assert.equal(boxes[0][0],372);assert.ok(boxes[0][0]+boxes[0][2]<=1186);
 for(const category of Object.keys(engine.options.NODE_SHAPES))assert.ok(labels.includes(category));
 assert.ok(labels.includes('聚合节点'));assert.ok(shapes.includes('star'));
 boxes.length=0;engine._renderNodeLegend(ctx,480,600,360,540);
 assert.equal(boxes[0][0],12);assert.ok(boxes[0][1]+boxes[0][3]<540);
 engine.destroy();
});
test('拖动时间表头同步复盘时点且保留所选手术与视口',()=>{
 const engine=makeEngine();engine.setViewDate('2026-10-21');engine.selectedSurgery={id:'OP1'};let time;
 engine.on('timeSelect',e=>time=e.detail.time);const offset=engine.offsetX;
 engine._onMouseDown({button:0,clientX:400,clientY:10});engine._onMouseMove({clientX:500,clientY:10});engine._onMouseUp({});engine._onClick({clientX:500,clientY:10});
 assert.equal(engine.offsetX,offset);assert.equal(engine.selectedSurgery.id,'OP1');assert.ok(time instanceof Date);assert.equal(time.getTime(),engine._xToTime(500).getTime());engine.destroy();
})
