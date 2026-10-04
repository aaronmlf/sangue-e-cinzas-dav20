const test = require('node:test');
const assert = require('node:assert/strict');
const Print = require('../app/print.js');

function character() {
  return {
    name: 'Inês <script>alert(1)</script>', player: 'Ana', chronicle: 'Sombras de Coimbra', clan: 'Brujah', generation: 11,
    attributes: {strength: 3, dexterity: 2, stamina: 2, charisma: 4, manipulation: 2, appearance: 1, perception: 2, intelligence: 3, wits: 2},
    abilities: {alertness: 2, legerdemain: 1, animalKen: 3, hearthWisdom: 4, theology: 2},
    virtues: {moral: 3, restraint: 4, courage: 3}, virtueTypes: {moral: 'conscience', restraint: 'selfControl'},
    road: 'Humanidade', roadScore: 1, willpower: 1, resources: {blood: 8, willpower: 2},
    health: {bashing: 2, lethal: 1, aggravated: 1, state: 'active'}, creation: {phase: 'allocation'},
    disciplines: [{name: 'Potência', rating: 2, inClan: true, book: 'core', page: 240, notes: 'Firmeza.'}],
    backgrounds: [{name: 'Aliados', rating: 2, notes: 'Uma ordem de escribas.'}],
    merits: [{name: 'Sentido Aguçado', cost: 1}], flaws: [{name: 'Inimigo', cost: 2}],
    inventory: [{name: 'Espada', quantity: 1, equipped: true, difficulty: 6, damage: 'Força + 2', notes: 'Aço.'}],
    bonuses: [{name: 'Dádiva', target: 'attribute:strength', value: 20000, enabled: true, duration: 'turns', remaining: 3}],
    experience: {total: 10, spent: 3, ledger: [{name: 'Briga', cost: 3}]},
    history: 'Prelúdio de uma personagem.', appearance: 'Cabelos escuros.', notes: 'Registro completo.', journal: [{date: '03/10/2026', text: 'Primeira noite.'}]
  };
}
const Rules = {calculate(c) {return {effective: {attributes: {...c.attributes, strength: c.attributes.strength + 20000}, abilities: c.abilities}, willpowerMax: 3, roadScore: 7, bloodMax: 12, bloodPerTurn: 1, initiative: 4, traitMax: 5, soak: {bashing:2,lethal:2,aggravated:1,fireSunlight:1}, healthPenalty: -2, creation: {freebieSpent: 0, freebieAvailable: 15}, warnings: []};}};

test('PDF template keeps effective ratings, high modifiers, original references and full text', () => {
  const c = character(); c.disciplines.push(...Array.from({length: 7}, (_, i) => ({name: `Disciplina adicional ${i + 1}`, rating: i + 1, notes: `Descrição ${i + 1}.`})));
  const html = Print.html(c, Rules);
  assert.match(html, /20\.003/);
  assert.match(html, /\+20\.000/);
  assert.match(html, /PDF p\. 240/);
  assert.match(html, /Disciplina adicional 7/);
  assert.match(html, /Primeira noite\./);
  assert.match(html, /Reserva de sangue/);
  assert.match(html, /Atual: <b>2 \/ 3<\/b>/);
  assert.match(html, /aria-label="7"/);
  assert.match(html, /Penalidade atual: -2/);
  assert.match(html, /Contusivo 2 · Letal 2 · Agravado 1 · Fogo\/sol 1/);
  assert.match(html, /Ativo · 3 turno\(s\)/);
  assert.match(html, /<td>Força<\/td>/);
  assert.match(html, /Inês &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('native official mapping resets all 992 fields and correctly maps dots, health and resources', () => {
  const fields = Print.officialFields(character(), Rules);
  assert.equal(Object.keys(fields).length, 992);
  assert.equal(fields.name, 'Inês <script>alert(1)</script>');
  assert.equal(fields.attrib1, '');
  assert.equal(fields.dot1, true); assert.equal(fields.dot3, true); assert.equal(fields.dot4, false); assert.equal(fields.dot8a, false);
  assert.equal(fields.dot9, true); assert.equal(fields.dot10, true); assert.equal(fields.dot11, false);
  assert.equal(fields.dot153, true); assert.equal(fields.dot155, true); assert.equal(fields.dot156, false);
  assert.equal(fields.dot313, true); assert.equal(fields.dot314, true); assert.equal(fields.dot315, false);
  assert.equal(fields.hdot7, true); assert.equal(fields.hdot8, false);
  assert.equal(fields.willdot3, true); assert.equal(fields.willdot4, false);
  assert.equal(fields.check2, true); assert.equal(fields.check3, false);
  assert.equal(fields.check18, true); assert.equal(fields.check19, false);
  assert.equal(fields.health1, '*'); assert.equal(fields.health2, 'X'); assert.equal(fields.health3, '/'); assert.equal(fields.health4, '/'); assert.equal(fields.health5, ' ');
  assert.equal(fields.merits1, 'Sentido Aguçado'); assert.equal(fields.merits15, '1');
  assert.equal(fields.flaws15, '2'); assert.equal(fields.combat1, 'Espada'); assert.equal(fields.combat13, 'Força + 2');
  assert.equal(fields.history1, 'Prelúdio de uma personagem.');
  assert.equal(fields.description12, 'Cabelos escuros.');
  assert.equal(fields.eb1, 'Uma ordem de escribas.');
  assert.equal(fields.name.includes('<script>'), true, 'PDF text stays literal, not HTML');
});

test('official capacity warnings disclose overflow while full printable sheet keeps all content', () => {
  const c = character(); c.attributes.wits = 12000; c.disciplines = Array.from({length: 7}, (_, i) => ({name: `D ${i}`, rating: 1})); c.history = 'Texto completo. '.repeat(200);
  const warning = Print.officialWarnings(c, Rules).join(' ');
  assert.match(warning, /5 disciplinas/);
  assert.match(warning, /10 linhas/);
  assert.match(warning, /9 círculos/);
  assert.match(warning, /Fontes, notas detalhadas/);
  assert.match(Print.html(c, Rules), /D 6/);
  assert.equal(Print.officialFields(c, Rules).attrib9, '12.000');
  assert.equal((Print.html(c, Rules).match(/Texto completo\./g) || []).length, 200);
});

test('template accepts a minimal character and excludes remote or malformed portraits', () => {
  assert.doesNotThrow(() => Print.html({}, null));
  assert.doesNotThrow(() => Print.officialFields({}, null));
  for (const portrait of ['https://example.invalid/test.png', 'javascript:alert(1)', 'data:image/svg+xml;base64,AAAA']) assert.doesNotMatch(Print.html({portrait}, null), /<img/);
});

test('actual engine integration uses base dots, complete modifiers and undefined third-generation limits', () => {
  const R = require('../app/engine.js'), c = R.create('Antediluviano');
  c.rulesMode = 'free'; c.generation = 3; c.attributes.strength = 20;
  c.bonuses.push({id:R.uid(),name:'Pacto',target:'attribute:strength',value:20000,enabled:true,duration:'turns',remaining:2,notes:''});
  const html = Print.html(c,R), fields = Print.officialFields(c,R);
  assert.match(html,/Dados atuais 20\.020/);
  assert.match(html,/Limite por turno: não definido/);
  assert.match(html,/não definido/);
  assert.equal(fields.attrib1,'20');
  assert.match(fields.misc1,/não definido/);
  assert.match(Object.values(fields).join(' '),/Pacto \+20\.000/);
});
