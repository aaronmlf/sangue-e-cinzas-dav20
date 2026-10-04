'use strict';
const {_electron}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),profile=path.join(root,'tmp/performance-profile');
(async()=>{let app;try{
 fs.rmSync(profile,{recursive:true,force:true});const begin=performance.now();
 app=await _electron.launch({executablePath:process.env.ELECTRON_PATH||require('electron'),args:['--no-sandbox','--disable-gpu',process.env.APP_PATH||path.join(root,'app'),'--user-data-dir='+profile],env:{...process.env,ELECTRON_DISABLE_SECURITY_WARNINGS:'true'}});
 const page=await app.firstWindow();await page.waitForSelector('h1');const startupMs=performance.now()-begin;
 assert.equal(await page.evaluate(()=>typeof VTM_CORPUS),'undefined');assert.equal(await page.evaluate(()=>!!searchWorker),false);
 const session=await app.context().newCDPSession(page);await session.send('Emulation.setCPUThrottlingRate',{rate:4});
 const results=await page.evaluate(async()=>{
  const paint=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const navigation=[];
  for(const screen of ['atributos','habilidades','vantagens','criacao','sessao','inventario','modificadores','personagem']){const start=performance.now();document.querySelector(`.nav [data-view="${screen}"]`).click();await paint();navigation.push({screen,ms:Math.round(performance.now()-start)})}
  const searches=[];for(const [kind,q]of [['catalog','auspex'],['catalog','ritual'],['library','blood'],['library','geração']]){view=kind==='catalog'?'catalogo':'biblioteca';const filter=kind==='catalog'?catalogFilter:libraryFilter;filter.query=q;filter.book='';filter.page=0;const start=performance.now();render();await waitForSearch();await paint();searches.push({kind,q,ms:Math.round(performance.now()-start),total:searchStates[kind].result.total})}
  const [first,second]=await Promise.all([workerRequest({kind:'catalog',query:'blood',book:'',page:0}),workerRequest({kind:'catalog',query:'auspex',book:'core',page:0})]);
  view='sessao';render();document.querySelector('#journal-text').value='Rascunho que deve sobreviver';document.querySelector('#roll-modifier').value='20000';document.querySelector('#roll-mode').value='soak';render();
  const preserved={draft:document.querySelector('#journal-text').value,modifier:document.querySelector('#roll-modifier').value,mode:document.querySelector('#roll-mode').value};
  return {navigation,searches,concurrent:[first.total,second.total],preserved,heapMiB:Math.round(performance.memory.usedJSHeapSize/1024**2)};
 });
 assert.deepEqual(results.preserved,{draft:'Rascunho que deve sobreviver',modifier:'20000',mode:'soak'});assert.ok(results.searches.every(x=>x.total>0));assert.ok(results.navigation.every(x=>x.ms<1500));assert.ok(results.searches.every(x=>x.ms<5000));
 await page.locator('[data-view="personagem"]').click();const field=page.locator('[data-field="name"]');await field.click();await field.press('Control+A');await field.pressSequentially('Inês de Óbidos — teste de fluidez',{delay:4});assert.equal(await field.inputValue(),'Inês de Óbidos — teste de fluidez');assert.equal(await page.evaluate(()=>document.activeElement.dataset.field),'name');assert.equal(await page.evaluate(()=>ch().name),'Inês de Óbidos — teste de fluidez');
 const data={startupMs:Math.round(startupMs),cpuSlowdown:4,...results};fs.mkdirSync(path.join(root,'tmp/qa'),{recursive:true});fs.writeFileSync(path.join(root,'tmp/qa/performance.json'),JSON.stringify(data,null,2));console.log(JSON.stringify(data,null,2));console.log('PASS: corpus fora da interface, pesquisa concorrente, digitação/foco e controles preservados com CPU 4× mais lenta.');
 }catch(e){console.error(e);process.exitCode=1}finally{if(app)await app.close()}})();
