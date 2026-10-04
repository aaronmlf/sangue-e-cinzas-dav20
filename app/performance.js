'use strict';
let searchWorker,searchSequence=0;
const searchRequests=new Map(),searchStates={catalog:{},library:{}};
let activeSearch=Promise.resolve();
function workerRequest(message){
 if(!searchWorker){searchWorker=new Worker('search-worker.js');searchWorker.onmessage=({data})=>{const pending=searchRequests.get(data.id);if(!pending)return;searchRequests.delete(data.id);if(data.error)pending.reject(Error(data.error));else pending.resolve(data.result)};searchWorker.onerror=()=>{const error=Error('Não foi possível carregar a pesquisa. Confira a pasta completa do aplicativo.');for(const pending of searchRequests.values())pending.reject(error);searchRequests.clear();searchWorker.terminate();searchWorker=null}};
 return new Promise((resolve,reject)=>{const id=++searchSequence;searchRequests.set(id,{resolve,reject});searchWorker.postMessage({...message,id,libraryReady:!!C.libraryReady})});
}
function searchResult(kind,params){
 const key=JSON.stringify(params),record=searchStates[kind];
 if(record.key!==key){record.key=key;record.result={rows:[],total:0,pending:true};
 activeSearch=workerRequest({kind,...params}).then(result=>{if(record.key!==key)return;record.result=result;if(view==='biblioteca'||view==='catalogo')render()}).catch(error=>{if(record.key!==key)return;record.result={rows:[],total:0,error:error.message};toast(error.message);render()});}
 return record.result;
}
function waitForSearch(){return activeSearch}
// Preserve existing inputs, scroll positions and DOM nodes during ordinary edits.
function patchApp(html){
 const template=document.createElement('template');template.innerHTML=html;
 function sync(parent,next){
  const children=Array.from(next.childNodes);
  for(let n=0;n<children.length;n++){
   const wanted=children[n],old=parent.childNodes[n];
   if(!old){parent.append(wanted.cloneNode(true));continue}
   if(old.nodeType!==wanted.nodeType||old.nodeName!==wanted.nodeName){old.replaceWith(wanted.cloneNode(true));continue}
   if(old.nodeType===Node.TEXT_NODE){if(old.data!==wanted.data)old.data=wanted.data;continue}
   if(old.nodeType!==Node.ELEMENT_NODE)continue;
   if(old.id!==wanted.id&&(old.id||wanted.id)){old.replaceWith(wanted.cloneNode(true));continue}
   for(const attr of Array.from(old.attributes))if(!wanted.hasAttribute(attr.name))old.removeAttribute(attr.name);
   for(const attr of wanted.attributes)if(old.getAttribute(attr.name)!==attr.value)old.setAttribute(attr.name,attr.value);
   const focused=old===document.activeElement;
   if(old instanceof HTMLInputElement){if(!focused&&!old.dataset.preserve&&old.value!==wanted.value)old.value=wanted.value;if(old.type==='checkbox')old.checked=wanted.checked;continue}
   if(old instanceof HTMLTextAreaElement){if(!focused&&!old.dataset.preserve&&old.value!==wanted.value)old.value=wanted.value;continue}
   // Preserve live, non-model controls (roll modifier, journal draft, etc.).
   const selected=old instanceof HTMLSelectElement&&!old.dataset.field&&!old.id.startsWith('catalog-')&&!old.id.startsWith('library-')?old.value:null;
   sync(old,wanted);
   if(old instanceof HTMLSelectElement){if(selected!==null&&Array.from(old.options).some(o=>o.value===selected))old.value=selected;else if(!focused)old.value=wanted.value}
  }
  while(parent.childNodes.length>children.length)parent.lastChild.remove();
 }
 sync(document.querySelector('#app'),template.content);
}
