'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFButton,
  PDFName, PDFDict, PDFStream, decodePDFRawStream
} = require('pdf-lib');
const Rules = require('../app/engine.js');
const Print = require('../app/print.js');
const fillOfficial = require(process.env.APP_PATH ? path.join(process.env.APP_PATH, 'official-form.cjs') : '../app/official-form.cjs');

const originalPath = process.env.APP_PATH ? path.join(process.env.APP_PATH, 'livros/ficha-oficial.pdf') : path.resolve(__dirname, '../app/livros/ficha-oficial.pdf');
const outputPath = path.resolve(__dirname, '../tmp/qa/official-test.pdf');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const pdfKey = key => PDFName.of(key);

function character() {
  const c = Rules.create('Inês de Óbidos');
  Object.assign(c, {
    player: 'João Gonçalves', chronicle: 'Crônicas de Évora', concept: 'Médica e intérprete',
    clan: 'Brujah', sire: 'Álvaro da Sé', nature: 'Defender', demeanor: 'Architect',
    generation: 7, rulesMode: 'free', road: 'Road of Humanity', roadScore: 8, willpower: 7,
    appearance: 'Cabelos castanhos; olhos âmbar. Usa lã, aço e o símbolo da mãe.',
    history: 'Nasceu em Óbidos e estudou em Évora. Protege crianças, viajantes e vítimas de guerra.',
    notes: 'A condição temporária deve manter o valor +20.000 sem alterar os círculos permanentes.',
    weakness: 'Paixão e fúria; resistência ao frenesi com dificuldade maior.',
    haven: 'Uma capela próxima à ponte de pedra.', birth: '1184', embrace: '1225'
  });
  c.creation.phase = 'play';
  c.attributes = {strength: 3, dexterity: 2, stamina: 4, charisma: 1, manipulation: 5, appearance: 2, perception: 4, intelligence: 3, wits: 9};
  for (const [i, key] of Rules.abilityKeys.entries()) c.abilities[key] = i % 10;
  c.specialties = {strength: 'Erguer portões', occult: 'Rituais portugueses', theology: 'Patrística'};
  c.virtues = {moral: 4, restraint: 4, courage: 5};
  c.virtueTypes = {moral: 'conscience', restraint: 'selfControl'};
  c.resources = {blood: 14, willpower: 3};
  c.health = {aggravated: 2, lethal: 2, bashing: 3, state: 'active'};
  c.disciplines = [
    {id:'d1',name:'Potence',rating:2,inClan:true,book:'core',page:235,notes:'Dados passivos; confira a força permanente separadamente.'},
    {id:'d2',name:'Celerity',rating:1,inClan:true,book:'core',page:203,notes:''},
    {id:'d3',name:'Presence',rating:3,inClan:true,book:'core',page:236,notes:''},
    {id:'d4',name:'Fortitude',rating:1,inClan:false,book:'core',page:222,notes:''},
    {id:'d5',name:'Auspex',rating:2,inClan:false,book:'core',page:195,notes:''}
  ];
  c.backgrounds = [
    {id:'b1',name:'Allies',rating:2,notes:'Irmãos da ordem e curandeiras locais.',book:'core',page:180},
    {id:'b2',name:'Contacts',rating:1,notes:'Mercadores de lã e notícias.',book:'core',page:180},
    {id:'b3',name:'Resources',rating:3,notes:'Uma propriedade próxima ao rio.',book:'core',page:182},
    {id:'b4',name:'Herd',rating:2,notes:'Viajantes que recebem abrigo.',book:'core',page:182},
    {id:'b5',name:'Mentor',rating:1,notes:'Álvaro orienta seus estudos.',book:'core',page:182}
  ];
  c.merits = [{id:'m1',name:'Literacy',cost:1,book:'core',page:423,notes:'Lê português e latim.'}];
  c.flaws = [{id:'f1',name:'Enemy',cost:2,book:'core',page:425,notes:'Um rival da corte.'}];
  c.paths = [{id:'p1',name:'The Path of Bone',rating:3,inClan:false,book:'core',page:279,notes:'Estudo autorizado pelo Narrador.'}];
  c.rituals = [{id:'r1',name:'Blood Walk',rating:2,inClan:false,book:'core',page:305,notes:''}];
  c.inventory = [{id:'i1',name:'Espada de aço',quantity:1,equipped:true,type:'weapon',damage:2,armor:0,penalty:0,weight:2,notes:'Herança da família.'}];
  c.bonuses = [{id:'bonus1',name:'Bênção da memória',target:'attribute:strength',value:20000,enabled:true,duration:'turns',remaining:3,notes:'Temporário, sem substituir Força permanente.'}];
  c.experience = {total:20,spent:5,ledger:[]};
  return c;
}

function canonicalValue(field) {
  if (field instanceof PDFTextField) return field.getText() || '';
  if (field instanceof PDFCheckBox) return field.isChecked();
  if (field instanceof PDFDropdown) return field.getSelected();
  if (field instanceof PDFButton) return 'image-button';
  throw new Error('Unexpected field type: ' + field.constructor.name);
}

function inherited(dict, key, context) {
  const visited = new Set();
  while (dict instanceof PDFDict) {
    assert(!visited.has(dict), 'No cycle in the widget/field Parent chain');
    visited.add(dict);
    if (dict.has(pdfKey(key))) return context.lookup(dict.get(pdfKey(key)));
    const parent = dict.get(pdfKey('Parent'));
    dict = parent ? context.lookup(parent) : undefined;
  }
  return undefined;
}

function inspectTopology(document, expectedNames) {
  const fields = document.getForm().getFields();
  assert.equal(fields.length, 992, 'The original AcroForm remains interactive with all fields');
  assert.equal(new Set(fields.map(f => f.getName())).size, 992, 'No duplicated canonical field names');
  assert.deepEqual(fields.map(f=>f.getName()).sort(), [...expectedNames].sort());
  const widgetOwners = new Map();
  const types = {};
  for (const field of fields) {
    types[field.constructor.name] = (types[field.constructor.name] || 0) + 1;
    const widgets = field.acroField.getWidgets();
    assert(widgets.length, field.getName() + ' has its widget');
    for (const widget of widgets) {
      assert(!widgetOwners.has(widget.dict), 'No widget belongs to two canonical fields');
      widgetOwners.set(widget.dict, field);
      const canonical = inherited(widget.dict, 'T', document.context);
      assert.equal(canonical.decodeText(), field.getName(), 'Page widget resolves to its canonical field name');
      const type = inherited(widget.dict, 'FT', document.context);
      assert(type instanceof PDFName, 'Widget inherits a native PDF form type');
      const appearances = widget.getAppearances();
      assert(appearances?.normal, field.getName() + ' has a normal appearance');
      const normal = appearances.normal;
      if (normal instanceof PDFStream) {
        assert(normal.getContents().length > 0, field.getName() + ' has a nonempty appearance stream');
      } else {
        assert(normal instanceof PDFDict, 'Checkbox appearance is a native state dictionary');
        const state = widget.getAppearanceState();
        assert(state instanceof PDFName, 'Checkbox has a selected appearance state');
        const stream = document.context.lookup(normal.get(state));
        assert(stream instanceof PDFStream && stream.getContents().length > 0, field.getName() + ' appearance matches its selected state');
      }
      if (!(field instanceof PDFButton)) {
        const value = inherited(widget.dict, 'V', document.context);
        if (field instanceof PDFCheckBox) {
          const on = widget.getOnValue();
          assert.equal(value?.toString() || '/Off', field.isChecked() ? on.toString() : '/Off', 'Canonical checked state and page widget agree');
          assert.equal(widget.getAppearanceState().toString(), field.isChecked() ? on.toString() : '/Off');
        } else if (field instanceof PDFDropdown) {
          assert.equal(value.decodeText(), field.getSelected()[0], 'Native dropdown /V agrees with canonical selection');
        } else {
          assert.equal(value?.decodeText() || '', field.getText() || '', 'Text /V agrees with its canonical value');
        }
      }
    }
  }
  assert.deepEqual(types, {PDFTextField:304,PDFCheckBox:679,PDFDropdown:7,PDFButton:2});
  const pageWidgets = new Set();
  const perPage = [];
  for (const page of document.getPages()) {
    let count = 0;
    const annotations = page.node.Annots();
    for (let i = 0; annotations && i < annotations.size(); i++) {
      const dict = document.context.lookup(annotations.get(i));
      if (dict.get(pdfKey('Subtype'))?.toString() !== '/Widget') continue;
      assert(widgetOwners.has(dict), 'Every page Widget is present in the canonical AcroForm tree');
      assert(!pageWidgets.has(dict), 'No Widget is duplicated across PDF pages');
      assert.equal(dict.lookup(pdfKey('P')).toString(), page.node.toString(), 'Widget belongs to the correct page');
      pageWidgets.add(dict); count++;
    }
    perPage.push(count);
  }
  assert.equal(pageWidgets.size, widgetOwners.size, 'No canonical widgets are missing from page annotation lists');
  assert.equal(pageWidgets.size, 992);
  assert.deepEqual(perPage, [650,248,57,37]);
  return fields;
}

function assertDots(form, names, rating) {
  names.forEach((name,i) => assert.equal(form.getCheckBox(name).isChecked(), i < rating, name));
}

function assertNativeCheckboxAppearances(original, filled) {
  const nativeFields = original.getForm().getFields().filter(field => field instanceof PDFCheckBox);
  const filledFields = new Map(filled.getForm().getFields().map(field => [field.getName(), field]));
  assert.equal(nativeFields.length, 679, 'Compare every original native checkbox');
  assert.equal([...filledFields.values()].filter(field => field instanceof PDFCheckBox).length, 679);
  let comparedStreams = 0, transparentOffStreams = 0;
  for (const nativeField of nativeFields) {
    const field = filledFields.get(nativeField.getName());
    assert(field instanceof PDFCheckBox, nativeField.getName() + ' remains a native checkbox');
    const nativeWidgets = nativeField.acroField.getWidgets(), widgets = field.acroField.getWidgets();
    assert.equal(widgets.length, nativeWidgets.length, 'Native checkbox widget count is preserved');
    nativeWidgets.forEach((nativeWidget, index) => {
      const nativeAppearances = nativeWidget.getAppearances(), appearances = widgets[index].getAppearances();
      assert(nativeAppearances.normal instanceof PDFDict, 'Native circles have a normal state dictionary');
      for (const kind of ['normal', 'rollover', 'down']) {
        const native = nativeAppearances[kind], current = appearances[kind];
        assert.equal(Boolean(current), Boolean(native), nativeField.getName() + ' preserves ' + kind + ' appearances');
        if (!native) continue;
        assert(native instanceof PDFDict && current instanceof PDFDict, 'Native checkbox state dictionaries are retained');
        const stateNames = native.keys().map(key => key.toString());
        // The source omits normal Off appearances. Only a transparent Off may
        // be added; every existing native circle/pressed state must survive.
        if (!native.has(pdfKey('Off'))) stateNames.push('/Off');
        assert.deepEqual(current.keys().map(key => key.toString()).sort(), stateNames.sort(),
          nativeField.getName() + ' ' + kind + ' retains every native state and only adds a missing Off');
        if (!native.has(pdfKey('Off'))) {
          const off = filled.context.lookup(current.get(pdfKey('Off')));
          assert(off instanceof PDFStream, 'Added Off is a native appearance stream');
          const drawing = Buffer.from(decodePDFRawStream(off).decode()).toString('ascii').trim().replace(/\s+/g, ' ');
          assert.equal(drawing, 'q Q', 'Added Off is transparent and draws no box over the printed circle');
          transparentOffStreams++;
        }
        for (const state of native.keys()) {
          const nativeStream = original.context.lookup(native.get(state));
          const currentStream = filled.context.lookup(current.get(state));
          assert(nativeStream instanceof PDFStream && currentStream instanceof PDFStream, 'State remains a native appearance stream');
          assert.deepEqual(Buffer.from(currentStream.getContents()), Buffer.from(nativeStream.getContents()),
            nativeField.getName() + ' ' + kind + ' ' + state.toString() + ' keeps the original circle appearance bytes');
          comparedStreams++;
        }
      }
    });
  }
  assert.equal(comparedStreams, 2037, 'All 679 normal and 1358 pressed-state native appearance streams were compared');
  assert.equal(transparentOffStreams, 679, 'All missing normal Off appearances are explicitly transparent');
}

test('filled official PDF preserves all canonical fields, accents, values, widgets and appearances', async () => {
  const original = await fs.readFile(originalPath), originalHash = digest(original);
  const blank = await PDFDocument.load(original);
  const originalFields = blank.getForm().getFields(), originalNames = originalFields.map(f=>f.getName());
  const c = character(), before = JSON.stringify(c);
  const bytes = await fillOfficial(c);
  assert.equal(JSON.stringify(c), before, 'Export must not mutate the character or its high modifier');
  await fs.mkdir(path.dirname(outputPath), {recursive:true});
  await fs.writeFile(outputPath, bytes);
  const document = await PDFDocument.load(await fs.readFile(outputPath));
  assert.equal(document.getPageCount(), 4);
  const fields = inspectTopology(document, originalNames), form = document.getForm();
  assertNativeCheckboxAppearances(blank, document);
  const expected = Print.officialFields(c, Rules);
  for (const field of fields) {
    assert.equal(field.constructor.name, originalFields.find(f=>f.getName()===field.getName()).constructor.name);
    if (field instanceof PDFButton) continue;
    const actual = canonicalValue(field);
    assert.deepEqual(actual, field instanceof PDFDropdown ? [expected[field.getName()]] : expected[field.getName()], 'Reloaded canonical field: '+field.getName());
  }
  const independent = {name:'Inês de Óbidos',player:'João Gonçalves',chronicle:'Crônicas de Évora',clan:'Brujah',gen:'7',sire:'Álvaro da Sé',concept:'Médica e intérprete',disciplines1:'Potence',disciplines5:'Auspex',back1:'Allies',back5:'Mentor',pathofenlight:'Road of Humanity',rituals1:'Blood Walk',rituals7:'2',paths1:'The Path of Bone',merits1:'Literacy',merits15:'1',flaws1:'Enemy',flaws15:'2',exp1:'20',exp2:'5'};
  for (const [name,value] of Object.entries(independent)) assert.equal(form.getTextField(name).getText(), value, name);
  assert.equal(form.getTextField('attrib1').getText(),'Erguer portões');
  assert.equal(form.getTextField('abilities30').getText(),'Patrística');
  assertDots(form,['dot1','dot2','dot3','dot4','dot5','dot6','dot7','dot8','dot8a'],3);
  assertDots(form,['dot65','dot66','dot67','dot68','dot69','dot70','dot71','dot72','dot72a'],9);
  assertDots(form,['dot73','dot74','dot75','dot76','dot77','dot78','dot79','dot80','dot80a'],0);
  assertDots(form,['dot153','dot154','dot155','dot156','dot157','dot158','dot159','dot160','dot160a'],0);
  assertDots(form,['dot313','dot314','dot315','dot316','dot317','dot318','dot319','dot320','dot320a'],2);
  assertDots(form,['dot409','dot410','dot411','dot412','dot413'],4);
  assertDots(form,['dot414','dot415','dot416','dot417','dot418'],4);
  assertDots(form,['dot419','dot420','dot421','dot422','dot423'],5);
  assertDots(form,Array.from({length:10},(_,i)=>'hdot'+(i+1)),8);
  assertDots(form,Array.from({length:10},(_,i)=>'willdot'+(i+1)),7);
  assertDots(form,Array.from({length:10},(_,i)=>'check'+(i+1)),3);
  assertDots(form,Array.from({length:50},(_,i)=>'check'+(i+11)),14);
  ['*','*','X','X','/','/','/'].forEach((value,i)=>assert.deepEqual(form.getDropdown('health'+(i+1)).getSelected(),[value]));
  assert.match(fields.filter(f=>f instanceof PDFTextField).map(f=>f.getText()||'').join(' '),/Bênção da memória \+20\.000/);
  const complete = Print.html(c,Rules);
  assert.match(complete,/20\.005/, 'Complete print includes base Strength 3 + Potence 2 + high bonus 20000');
  assert.match(complete,/\+20\.000/);
  assert.match(Print.officialWarnings(c,Rules).join(' '),/modificadores.*PDF completo/, 'Native form limitations are disclosed');
  assert.equal(digest(await fs.readFile(originalPath)),originalHash,'The supplied blank official PDF is unchanged');
});

test('native health dropdown retains blank, bashing, lethal and aggravated states and explicit overflow warnings', async () => {
  const c = character(); c.health = {aggravated:1,lethal:1,bashing:1,state:'active'};
  const doc = await PDFDocument.load(await fillOfficial(c)), form = doc.getForm();
  const values = ['*','X','/',' ',' ',' ',' '];
  values.forEach((value,i)=>{
    const field = form.getDropdown('health'+(i+1));
    assert.deepEqual(field.getOptions(),[' ','/','X','*']);
    assert.deepEqual(field.getSelected(),[value]);
    assert.equal(field.acroField.dict.lookup(pdfKey('V')).decodeText(),value);
  });
  c.attributes.wits = 12000;
  c.disciplines.push({id:'overflow',name:'Disciplina excedente',rating:1,inClan:false,notes:'Permanece completa.',book:'core',page:189});
  c.history = 'História integral de São Gonçalo. '.repeat(60);
  const warnings = Print.officialWarnings(c,Rules).join(' ');
  assert.match(warnings,/5 disciplinas/);
  assert.match(warnings,/9 círculos/);
  assert.match(warnings,/10 linhas/);
  assert.match(warnings,/PDF completo/);
  const html = Print.html(c,Rules);
  assert.match(html,/Disciplina excedente/);
  assert.match(html,/12\.000/);
  assert.equal((html.match(/História integral de São Gonçalo\./g)||[]).length,60);
});
