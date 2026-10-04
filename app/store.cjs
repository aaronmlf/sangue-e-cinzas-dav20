'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
class Store{
 constructor(file){this.file=file;this.previous=null;this.queue=Promise.resolve()}
 async load(){let text;try{text=await fs.readFile(this.file,'utf8')}catch(e){if(e.code==='ENOENT')return null;throw e}try{const data=JSON.parse(text);this.previous=text;return data}catch{try{const backup=await fs.readFile(this.file+'.bak','utf8');const data=JSON.parse(backup);this.previous=backup;return {...data,recovered:true}}catch{throw Error('Os dados locais estão corrompidos. Preserve a pasta dados e restaure um backup exportado.')}}}
 save(text){if(typeof text!=='string')text=JSON.stringify(text);if(Buffer.byteLength(text)>100*1024*1024)return Promise.reject(Error('O arquivo de fichas excedeu 100 MB. Exporte um backup e reduza os retratos.'));
  this.queue=this.queue.catch(()=>{}).then(async()=>{if(text===this.previous)return true;await fs.mkdir(path.dirname(this.file),{recursive:true});if(this.previous!==null)await fs.writeFile(this.file+'.bak',this.previous);await fs.writeFile(this.file+'.tmp',text);await fs.rename(this.file+'.tmp',this.file);this.previous=text;return true});return this.queue;
 }
}
module.exports=Store;
