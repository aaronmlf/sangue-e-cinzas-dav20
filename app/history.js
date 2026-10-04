(function(root,factory){if(typeof module==='object')module.exports=factory();else root.EditHistory=factory()})(globalThis,function(){
'use strict';
const clone=v=>v===undefined?undefined:structuredClone(v);
const keys=new Set(['name','player','chronicle','concept','clan','sire','nature','demeanor','sect','haven','road','birth','embrace','appearance','history','notes','portrait','attributes','abilities','virtues','virtueTypes','roadScore','willpower','resources','health','generation','creation','rulesMode','experience','disciplines','backgrounds','paths','merits','flaws','inventory','bonuses','specialties','conditions','journal','rolls','createdAt','rituals','campaign','weakness','customAbilities','customTraits','bloodPreference']);
class Journal{
 constructor(){this.undo=[];this.redo=[];this.baseline=new Map();this.suspended=false;this.sizes=new WeakMap()}
 reset(characters){this.baseline=new Map(characters.map(c=>[c.id,clone(c)]))}
 record(characters,label='Editar ficha',hint=null){
  if(this.suspended)return;
  const changes=[],current=new Map(characters.map(c=>[c.id,c]));
  for(const c of characters){const before=this.baseline.get(c.id);if(!before){changes.push({id:c.id,kind:'add',after:clone(c)});continue}
   const changedKeys=hint?(c.id===hint.id&&keys.has(hint.key)?[hint.key]:[]):keys;
   for(const key of changedKeys){const a=before[key],b=c[key];if(a===b)continue;if(typeof a==='object'&&typeof b==='object'&&JSON.stringify(a)===JSON.stringify(b))continue;changes.push({id:c.id,kind:'field',key,before:clone(a),after:clone(b)})}
  }
  for(const [id,c] of this.baseline)if(!current.has(id))changes.push({id,kind:'delete',before:clone(c)});
  if(!changes.length)return;
  const now=Date.now(),last=this.undo.at(-1),merge=changes.length===1&&changes[0].kind==='field'&&last?.changes.length===1&&last.changes[0].id===changes[0].id&&last.changes[0].key===changes[0].key&&now-last.time<1200&&label===last.label&&label.startsWith('Editar campo');
  if(merge){last.changes[0].after=changes[0].after;last.time=now;this.sizes.delete(last)}else this.undo.push({label,time:now,changes});
  this.redo=[];
  const size=e=>{if(!this.sizes.has(e))this.sizes.set(e,JSON.stringify(e).length);return this.sizes.get(e)};
  let bytes=this.undo.reduce((sum,e)=>sum+size(e),2);
  while(this.undo.length>30||bytes>10*1024*1024)bytes-=size(this.undo.shift());
  // Update only changed keys; portrait strings and untouched characters are reused.
  for(const change of changes){if(change.kind==='delete')this.baseline.delete(change.id);else if(change.kind==='add')this.baseline.set(change.id,clone(change.after));else{this.baseline.get(change.id)[change.key]=clone(change.after)}}
 }
 apply(state,direction,validate){
  const from=direction==='undo'?this.undo:this.redo,to=direction==='undo'?this.redo:this.undo,entry=from.at(-1);if(!entry)return null;
  let chars=state.characters.map(c=>({...c}));
  for(const p of direction==='undo'?[...entry.changes].reverse():entry.changes){
   const remove=(p.kind==='add'&&direction==='undo')||(p.kind==='delete'&&direction==='redo');
   if(remove){chars=chars.filter(c=>c.id!==p.id);continue}
   if(p.kind!=='field'){chars.push(clone(direction==='undo'?p.before:p.after));continue}
   if(!keys.has(p.key))throw Error('Alteração inválida no histórico.');
   const c=chars.find(c=>c.id===p.id);if(!c)throw Error('A ficha do histórico não foi encontrada.');c[p.key]=clone(direction==='undo'?p.before:p.after);
  }
  chars=validate(chars);from.pop();to.push(entry);state.characters=chars;
  const affected=entry.changes.find(p=>chars.some(c=>c.id===p.id));state.selected=affected?.id||(chars.some(c=>c.id===state.selected)?state.selected:chars[0]?.id);
  this.reset(chars);return entry.label;
 }
 serialize(){return {undo:this.undo,redo:this.redo}}
 restore(raw,characters){
  this.undo=[];this.redo=[];
  if(raw&&JSON.stringify(raw).length<=12*1024*1024){for(const name of ['undo','redo'])if(Array.isArray(raw[name]))this[name]=raw[name].slice(-30).filter(e=>e&&typeof e.label==='string'&&Number.isFinite(e.time)&&Array.isArray(e.changes)&&e.changes.length<=1000&&e.changes.every(p=>p&&typeof p.id==='string'&&['add','delete','field'].includes(p.kind)&&(p.kind!=='field'||keys.has(p.key))))}
  this.reset(characters);
 }
}
return {Journal};
});
