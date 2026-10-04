'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
test('Public checkout has usable empty metadata and no full-book text',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'app/data/metadata.js'),'utf8'),context);
 assert.equal(context.window.VTM_CATALOG.libraryReady,false);assert.equal(context.window.VTM_CATALOG.pageCount,0);assert.equal(context.window.VTM_CATALOG.entryCount,0);
 assert.equal(fs.existsSync(path.join(root,'app/data/catalog-bootstrap.js')),true);
});
test('Search worker returns empty results before a user initializes the library',()=>{
 const replies=[],loads=[];const context={self:{postMessage:value=>replies.push(value)},Map};
 context.importScripts=file=>{loads.push(file);vm.runInNewContext(fs.readFileSync(path.join(root,'app',file),'utf8'),context)};
 vm.runInNewContext(fs.readFileSync(path.join(root,'app/search-worker.js'),'utf8'),context);
 for(const kind of ['catalog','library']){context.self.onmessage({data:{id:kind,kind,query:'auspícios',libraryReady:false}});assert.equal(replies.at(-1).result.total,0);assert.equal(replies.at(-1).result.rows.length,0)}
 assert.deepEqual(loads,['data/catalog-bootstrap.js']);
 context.self.onmessage({data:{id:3,kind:'page',book:'core',page:195,libraryReady:false}});assert.match(replies.at(-1).error,/Página não encontrada/);
});
test('Worker loads a personal catalog once when a local library becomes available',()=>{
 const replies=[],loads=[];const context={self:{postMessage:value=>replies.push(value)},Map};
 context.importScripts=file=>{loads.push(file);if(file==='data/catalog.js'){context.self.VTM_CORPUS={pages:[{book:'core',page:195,text:'Auspícios: percepção sobrenatural'}],entries:[{id:'e1',book:'core',page:195,category:'discipline',name:'Auspex',label:'Auspícios',text:'Percepção sobrenatural'}]};return}vm.runInNewContext(fs.readFileSync(path.join(root,'app',file),'utf8'),context)};
 vm.runInNewContext(fs.readFileSync(path.join(root,'app/search-worker.js'),'utf8'),context);
 context.self.onmessage({data:{id:1,kind:'catalog',query:'auspicios sobrenatural',libraryReady:true}});assert.equal(replies.at(-1).result.total,1);
 context.self.onmessage({data:{id:2,kind:'page',book:'core',page:195,libraryReady:true}});assert.equal(replies.at(-1).result.page,195);
 assert.equal(loads.filter(file=>file==='data/catalog.js').length,1);
});
