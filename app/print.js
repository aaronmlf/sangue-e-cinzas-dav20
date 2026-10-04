(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VampirePrint = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const attributeGroups = [
    ['Físicos', [['strength', 'Força'], ['dexterity', 'Destreza'], ['stamina', 'Vigor']]],
    ['Sociais', [['charisma', 'Carisma'], ['manipulation', 'Manipulação'], ['appearance', 'Aparência']]],
    ['Mentais', [['perception', 'Percepção'], ['intelligence', 'Inteligência'], ['wits', 'Raciocínio']]]
  ];
  const abilityGroups = [
    ['Talentos', [['alertness', 'Prontidão'], ['athletics', 'Esportes'], ['awareness', 'Consciência'], ['brawl', 'Briga'], ['empathy', 'Empatia'], ['expression', 'Expressão'], ['intimidation', 'Intimidação'], ['leadership', 'Liderança'], ['legerdemain', 'Prestidigitação'], ['subterfuge', 'Subterfúgio']]],
    ['Perícias', [['animalKen', 'Empatia com Animais'], ['archery', 'Arquearia'], ['commerce', 'Comércio'], ['crafts', 'Ofícios'], ['etiquette', 'Etiqueta'], ['melee', 'Armas Brancas'], ['performance', 'Performance'], ['ride', 'Cavalgar'], ['stealth', 'Furtividade'], ['survival', 'Sobrevivência']]],
    ['Conhecimentos', [['academics', 'Acadêmicos'], ['enigmas', 'Enigmas'], ['hearthWisdom', 'Sabedoria Popular'], ['investigation', 'Investigação'], ['law', 'Direito'], ['medicine', 'Medicina'], ['occult', 'Ocultismo'], ['politics', 'Política'], ['seneschal', 'Senescalia'], ['theology', 'Teologia']]]
  ];
  const virtueNames = {conscience: 'Consciência', conviction: 'Convicção', selfControl: 'Autocontrole', instinct: 'Instinto', courage: 'Coragem'};
  const healthNames = ['Escoriado', 'Machucado', 'Ferido', 'Ferido gravemente', 'Espancado', 'Aleijado', 'Incapacitado'];
  const healthPenalties = ['0', '-1', '-1', '-2', '-2', '-5', ''];
  const attrNames = Object.fromEntries(attributeGroups.flatMap(x => x[1]));
  const abilityNames = Object.fromEntries(abilityGroups.flatMap(x => x[1]));
  const effectNames = {...attrNames, ...abilityNames, willpower: 'Força de Vontade', blood: 'Sangue', initiative: 'Iniciativa', soak: 'Absorção', damage: 'Dano', dice: 'Parada de dados', road: 'Caminho'};
  const knownBooks = {
    core: 'V20 Dark Ages - livro básico', 'v20-dark-ages': 'V20 Dark Ages - livro básico',
    dav20: 'V20 Dark Ages - livro básico', DAV20: 'V20 Dark Ages - livro básico',
    companion: 'V20 Dark Ages Companion - tradução fornecida', secrets: 'V20 Dark Ages - Tome of Secrets',
    sheet: 'Ficha oficial DAV20', 'dav20-sheet': 'Ficha oficial DAV20'
  };
  function targetLabel(target) {
    const key = String(target || '').replace(/^(attribute|ability):/, '');
    return effectNames[key] || {difficulty:'Dificuldade',bloodMax:'Sangue máximo',bloodPerTurn:'Sangue por turno',traitMax:'Limite de característica'}[key] || key || 'Geral';
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, x => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[x]));
  }
  function list(value) { return Array.isArray(value) ? value : []; }
  function num(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
  function format(value) { return num(value).toLocaleString('pt-BR', {maximumFractionDigits: 10}); }
  function dateLabel(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}T/.test(String(value))) return String(value || '');
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  }
  function named(value, fallback = 'Não informado') { return typeof value === 'object' && value ? value.name || value.label || fallback : value == null || value === '' ? fallback : value; }
  function rating(item) { return num(typeof item === 'object' && item ? item.rating ?? item.value ?? item.dots : item); }
  function dots(value, max = 5, box = false) {
    const n = num(value), limit = Math.min(10, Math.max(max, Math.ceil(n))), count = Math.max(0, Math.min(limit, Math.floor(n)));
    return `<span class="rating ${box ? 'boxes' : ''}" aria-label="${esc(format(n))}">${Array.from({length: limit}, (_, i) => `<i class="${i < count ? 'filled' : ''}"></i>`).join('')}<b>${esc(format(n))}</b></span>`;
  }
  function source(item) {
    if (!item || !item.book && !item.source) return '';
    const id = typeof item.source === 'object' ? item.source.book || item.book : item.book || item.source;
    const catalog = root.VTM_CATALOG || root.VampireCatalog || root.CATALOG || {};
    const book = list(catalog.books).find(x => x.id === id || x.file === id);
    const title = item.bookTitle || book?.title || knownBooks[id] || String(id).replace(/_/g, ' ').replace(/\.pdf$/i, '');
    const page = item.page || item.source?.page;
    return `${esc(title)}${page ? ` · PDF p. ${esc(page)}` : ''}`;
  }
  function paragraph(text, className = '') {
    return String(text || '').trim().split(/\n\s*\n/).map(t => `<p class="${className}">${esc(t)}</p>`).join('');
  }
  function field(label, value) { return `<div class="identity-field"><span>${esc(label)}</span><strong>${esc(named(value, '—'))}</strong></div>`; }
  function title(text, subtitle = '') { return `<h2>${esc(text)}${subtitle ? `<small>${esc(subtitle)}</small>` : ''}</h2>`; }
  function traitRows(items, opts = {}) {
    const shown = list(items).slice(0, opts.limit || 5);
    return (shown.length ? shown.map(i => `<div class="trait-row"><span>${esc(named(i))}</span>${dots(rating(i), opts.max || 5)}</div>`).join('') : '<p class="empty">Nenhum registro.</p>') + (list(items).length > shown.length ? `<small class="continuation">+ ${list(items).length - shown.length} registros nas páginas seguintes.</small>` : '');
  }
  function traitDetail(items, category, opts = {}) {
    if (!list(items).length) return '';
    return `<section class="detail-section">${title(category)}${list(items).map(i => {
      const value = opts.cost ? num(i.cost ?? i.points ?? 0) : rating(i);
      const unit = `${format(value)} ${value === 1 ? 'ponto' : 'pontos'}${opts.flaw ? value === 1 ? ' concedido' : ' concedidos' : ''}`;
      const choices = typeof i.choices === 'object' && i.choices ? Object.entries(i.choices).map(([k, v]) => `${k}: ${v}`).join(' · ') : i.choice || i.specialty || '';
      return `<article class="detail-item ${String(i.notes || '').length > 500 ? 'long-item' : ''}"><div class="detail-item-head"><h3>${esc(named(i))}</h3><span>${esc(unit)}${opts.clan && i.inClan === true ? ' · de clã' : opts.clan && i.inClan === false ? ' · fora do clã' : ''}</span></div>${source(i) ? `<small class="source">${source(i)}</small>` : ''}${choices ? paragraph(choices, 'choice') : ''}${paragraph(i.notes || i.description)}</article>`;
    }).join('')}</section>`;
  }
  function orderedHealth(h = {}) {
    const aggravated = Math.max(0, Math.floor(num(h.aggravated))), lethal = Math.max(0, Math.floor(num(h.lethal))), bashing = Math.max(0, Math.floor(num(h.bashing)));
    const types = Array(Math.min(7, aggravated)).fill('aggravated').concat(Array(Math.min(7, lethal)).fill('lethal'), Array(Math.min(7, bashing)).fill('bashing')).slice(0, 7);
    return {aggravated, lethal, bashing, types, total: aggravated + lethal + bashing};
  }
  function healthBlock(c, calc) {
    const h = orderedHealth(c.health), state = c.health?.state || 'active';
    return `<section class="health-block">${title('Vitalidade', state === 'torpor' ? 'EM TORPOR' : state === 'finalDeath' ? 'MORTE FINAL' : '')}<div class="health-rows">${healthNames.map((name, i) => `<div><span>${name}</span><small>${healthPenalties[i]}</small><i class="wound ${h.types[i] || ''}">${h.types[i] === 'aggravated' ? '*' : h.types[i] === 'lethal' ? '×' : h.types[i] === 'bashing' ? '/' : ''}</i></div>`).join('')}</div><p class="health-key"><b>/</b> Contusivo ${format(h.bashing)} &nbsp; <b>×</b> Letal ${format(h.lethal)} &nbsp; <b>*</b> Agravado ${format(h.aggravated)}</p>${h.total > 7 ? `<small>${format(h.total)} níveis registrados; confira o estado com o narrador.</small>` : ''}${calc.healthPenalty != null || calc.health?.penalty != null || calc.woundPenalty != null ? `<small>Penalidade atual: ${esc(format(calc.healthPenalty ?? calc.woundPenalty ?? calc.health?.penalty))}</small>` : ''}</section>`;
  }
  function bloodBlock(c, calc) {
    const maxRaw = Object.hasOwn(calc, 'bloodMax') ? calc.bloodMax : calc.maxBlood ?? calc.blood?.max ?? 10;
    const turnRaw = Object.hasOwn(calc, 'bloodPerTurn') ? calc.bloodPerTurn : calc.blood?.perTurn ?? 1;
    const max = maxRaw === null ? null : num(maxRaw, 10), current = num(c.resources?.blood ?? c.blood, max ?? 0), boxes = max === null ? 0 : Math.min(50, Math.max(0, Math.ceil(max)));
    return `<section>${title('Reserva de sangue')}<div class="blood-title"><b>${esc(format(current))} / ${max === null ? 'não definido' : esc(format(max))}</b><small>${turnRaw === null ? 'Limite por turno: não definido' : `${esc(format(turnRaw))} ponto(s) por turno`}</small></div><div class="blood-boxes">${Array.from({length: boxes}, (_, i) => `<i class="${i < current ? 'filled' : ''}"></i>`).join('')}</div>${max > 50 ? '<small>O total numérico acima representa a reserva completa.</small>' : ''}</section>`;
  }
  function bonusDetails(c) {
    if (!list(c.bonuses).length) return '';
    return `<section class="detail-section">${title('Modificadores registrados')}<table><thead><tr><th>Origem</th><th>Alvo</th><th>Valor</th><th>Estado / duração</th></tr></thead><tbody>${c.bonuses.map(b => `<tr><td>${esc(b.name || b.source || 'Modificador')}${b.notes ? paragraph(b.notes) : ''}</td><td>${esc(targetLabel(b.target || b.trait))}</td><td class="number">${num(b.value) >= 0 ? '+' : ''}${esc(format(b.value))}</td><td>${b.enabled === false || b.duration === 'turns' && b.remaining === 0 ? 'Inativo' : 'Ativo'}${b.duration === 'turns' || b.duration === 'rounds' ? ` · ${format(b.remaining ?? b.rounds)} turno(s)` : b.duration === 'combat' || b.duration === 'scene' ? ' · cena' : ' · permanente'}</td></tr>`).join('')}</tbody></table></section>`;
  }
  function inventoryDetails(c) {
    if (!list(c.inventory).length) return '';
    return `<section class="detail-section">${title('Equipamentos e armas')}<table class="equipment"><thead><tr><th>Item</th><th>Qtd.</th><th>Uso em combate</th></tr></thead><tbody>${c.inventory.map(i => `<tr><td><b>${esc(i.name || 'Item')}</b>${i.equipped ? '<small>Equipado</small>' : ''}${i.notes ? paragraph(i.notes) : ''}${source(i) ? `<small>${source(i)}</small>` : ''}</td><td class="number">${esc(format(i.quantity ?? 1))}</td><td>${[['Dificuldade', i.difficulty], ['Dano', i.damage], ['Alcance', i.range], ['Taxa', i.rate], ['Munição', i.clip], ['Ocultação', i.conceal], ['Armadura', i.armor], ['Penalidade', i.penalty]].filter(x => x[1] != null && x[1] !== '').map(([label, value]) => `<span>${esc(label)}: ${esc(value)}</span>`).join('<br>') || '—'}</td></tr>`).join('')}</tbody></table></section>`;
  }
  function calculations(c, calc) {
    const info = [];
    if (calc.initiative != null) info.push(['Iniciativa', `${format(calc.initiative)} + 1d10`]);
    if (calc.maxTrait != null || calc.traitMax != null) info.push(['Limite geracional', `${format(calc.maxTrait ?? calc.traitMax)} pontos`]);
    if (calc.soak && typeof calc.soak === 'object') info.push(['Absorção (dados)', `Contusivo ${format(calc.soak.bashing)} · Letal ${format(calc.soak.lethal)} · Agravado ${format(calc.soak.aggravated)} · Fogo/sol ${format(calc.soak.fireSunlight)}`]);
    else if (calc.soak != null) info.push(['Absorção', `${format(calc.soak)} dados`]);
    const xp = c.experience || {};
    info.push(['Experiência', `${format(xp.total)} total · ${format(xp.spent)} gasta · ${format(num(xp.total) - num(xp.spent))} disponível`]);
    const creation = c.creation || {}, phase = {allocation: 'Distribuição inicial', freebies: 'Pontos de bônus', play: 'Em jogo'}[creation.phase] || 'Distribuição inicial';
    info.push(['Criação', phase]);
    if (calc.creation?.freebieSpent != null || calc.freebieSpent != null || calc.freebies?.spent != null) info.push(['Pontos de bônus', `${format(calc.creation?.freebieSpent ?? calc.freebieSpent ?? calc.freebies?.spent)} / ${format(calc.creation?.freebieAvailable ?? calc.freebieAvailable ?? calc.freebies?.available ?? 15)} gastos`]);
    return `<section class="calculation-strip">${info.map(([key, value]) => `<div><span>${esc(key)}</span><strong>${esc(value)}</strong></div>`).join('')}</section>`;
  }
  function storyDetails(c) {
    const sections = [
      ['Descrição e personalidade', c.appearance], ['História e prelúdio', c.history || c.story], ['Objetivos', c.goals], ['Refúgio', c.haven], ['Território de caça', c.feedingGrounds], ['Coterie e relações', c.coterie], ['Perturbações', Array.isArray(c.derangements) ? c.derangements.map(named).join('\n') : c.derangements], ['Anotações', c.notes]
    ].filter(x => typeof x[1] === 'string' && x[1].trim());
    const journals = list(c.journal), ledgers = list(c.experience?.ledger);
    if (!sections.length && !journals.length && !ledgers.length) return '';
    return `<section class="stories">${sections.map(([heading, text]) => `<section class="detail-section">${title(heading)}${paragraph(text)}</section>`).join('')}${journals.length ? `<section class="detail-section">${title('Diário da crônica')}${journals.map(j => `<article class="journal-item ${String(j.text || j.notes || '').length > 500 ? 'long-item' : ''}"><h3>${esc(j.title || dateLabel(j.date || j.at) || 'Registro')}</h3>${j.title && (j.date || j.at) ? `<small>${esc(dateLabel(j.date || j.at))}</small>` : ''}${paragraph(j.text || j.notes || (typeof j === 'string' ? j : ''))}</article>`).join('')}</section>` : ''}${ledgers.length ? `<section class="detail-section">${title('Registro de experiência')}${ledgers.map(j => `<article class="journal-item ${String(j.notes || '').length > 500 ? 'long-item' : ''}"><h3>${esc(j.name || j.description || j.label || j.trait || 'Evolução')} <small>${esc(format(j.cost ?? j.points ?? 0))} XP</small></h3>${j.date || j.at ? `<small>${esc(dateLabel(j.date || j.at))}</small>` : ''}${j.story ? paragraph('História: ' + j.story) : ''}${paragraph(j.notes)}</article>`).join('')}</section>` : ''}</section>`;
  }
  function portrait(c) {
    return typeof c.portrait === 'string' && /^data:image\/(png|jpe?g|webp);base64,[a-z\d+/=\s]+$/i.test(c.portrait) ? `<img class="portrait" src="${esc(c.portrait)}" alt="Retrato de ${esc(c.name)}">` : '';
  }

  const css = `
    @page{size:A4;margin:11mm 12mm 12mm}*{box-sizing:border-box}html{background:#fff}body{margin:0;color:#262020;font:9pt Arial,Helvetica,sans-serif;line-height:1.3}h1,h2,h3,p{margin:0}h1{font:700 25pt Georgia,'Times New Roman',serif;line-height:1.05;overflow-wrap:anywhere}h2{font:700 10pt Georgia,'Times New Roman',serif;border-bottom:1.2pt solid #792b34;color:#65242e;padding:2.4mm 0 1.2mm;margin:0 0 1.4mm;display:flex;justify-content:space-between;gap:3mm;break-after:avoid}h2 small{font:7pt Arial,sans-serif;color:#675b5c;align-self:center}h3{font-size:9pt}p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;margin:1.5mm 0}small{font-size:7.3pt;color:#665b5d;overflow-wrap:anywhere}strong,b{overflow-wrap:anywhere}.masthead{border-top:2pt solid #792b34;border-bottom:.7pt solid #792b34;padding:2.4mm 0;display:flex;align-items:center;gap:4mm}.brand{font:8pt Arial,sans-serif;letter-spacing:2px;color:#792b34;margin-bottom:1.5mm}.edition{font:9pt Georgia,serif;margin:1.4mm 0;color:#665b5d}.concept{font-size:9pt;margin:1mm 0 0}.portrait{width:18mm;height:23mm;object-fit:cover;flex-shrink:0}.masthead>div{min-width:0}.identity{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.8mm 4mm;margin:2mm 0 0}.identity-field{display:flex;gap:1.5mm;align-items:baseline;font-size:8pt;min-width:0}.identity-field span{color:#695c5c;flex-shrink:0}.identity-field strong{font-weight:600;min-width:0}.triple{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4mm}.group-title{font-size:8pt;font-weight:700;text-align:center;letter-spacing:.8px;color:#695c5c;margin:1mm 0 1.8mm}.trait-row{display:flex;align-items:center;justify-content:space-between;gap:1mm;min-height:4mm;border-bottom:.3pt dotted #ddcecf;font-size:8pt;break-inside:avoid}.trait-row>span:first-child{min-width:0;overflow-wrap:anywhere}.rating{display:inline-flex;gap:.65mm;align-items:center;flex-shrink:0;white-space:nowrap}.rating i{display:inline-block;width:1.55mm;height:1.55mm;border:.6pt solid #43363a;border-radius:50%;flex-shrink:0}.rating i.filled{background:#43363a}.rating b{font:7pt Arial,sans-serif;padding-left:.5mm;min-width:2mm}.rating.boxes i{border-radius:0}.continuation,.empty{font-size:7pt;color:#7a6d6f;line-height:1.3;margin:1.5mm 0;display:block}.advantages .trait-row{min-height:4mm}.virtue-list .trait-row{display:block;min-height:7.5mm}.virtue-list .rating{display:flex;justify-content:flex-end;margin-top:.5mm}.virtue-list .trait-row>span:first-child{font-size:7.8pt}.resources{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(0,1.1fr);gap:5mm;margin-top:1mm}.resource-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4mm}.resource-pair h2{padding-top:2mm}.resource-name{font:8pt Georgia,serif;margin:.5mm 0 1.4mm;overflow-wrap:anywhere}.resource-pair .rating{gap:.6mm}.resource-pair .rating i{width:1.7mm;height:1.7mm}.resource-pair .rating b{font-size:8pt}.resource-current{margin:1.3mm 0 0;font-size:8pt}.blood-title{display:flex;justify-content:space-between;align-items:baseline;margin:0 0 1.4mm;gap:3mm;font-size:9pt}.blood-boxes{display:grid;grid-template-columns:repeat(20,2mm);gap:1mm}.blood-boxes i{display:block;width:2mm;height:2mm;border:.6pt solid #792b34}.blood-boxes i.filled{background:#792b34}.health-block h2{padding-top:2mm}.health-rows>div{display:grid;grid-template-columns:1fr 5mm 3mm;gap:2mm;align-items:center;min-height:3.9mm;font-size:7.8pt}.health-rows small{text-align:right}.wound{width:2.8mm;height:2.8mm;border:.6pt solid #796569;font:9pt Arial,sans-serif;line-height:2.4mm;text-align:center;color:#792b34;font-style:normal}.health-key{font-size:6.8pt;line-height:1.25;margin:1mm 0}.weakness{border:.5pt solid #ddcecf;background:#faf7f7;padding:2mm;margin-top:2mm;font-size:7.6pt;line-height:1.4}.weakness b{color:#65242e}.calculation-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2mm 4mm;border-top:.5pt solid #ddcecf;border-bottom:.5pt solid #ddcecf;padding:1.8mm 0;margin-top:2mm;break-inside:avoid;font-size:7.4pt}.calculation-strip span{display:block;color:#746467}.calculation-strip strong{display:block;font-weight:600;margin-top:.6mm}.warning{font-size:7.4pt;line-height:1.35;border-left:2pt solid #792b34;padding-left:2mm;margin:2mm 0;break-inside:avoid}.footer{border-top:.5pt solid #ddcecf;padding-top:1.5mm;font-size:6.7pt;color:#77686b;line-height:1.4;margin-top:2mm;break-inside:avoid}.sheet-two{break-before:page}.page-heading{font:700 15pt Georgia,serif;border-top:2pt solid #792b34;padding-top:3mm;color:#65242e}.page-heading small{font:8pt Arial,sans-serif;color:#77686b;display:block;margin-top:1mm}.details-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5mm;align-items:start}.detail-section{margin:1mm 0 1.5mm}.detail-item{margin-bottom:1.3mm;break-inside:avoid}.detail-item.long-item{break-inside:auto}.detail-item-head{display:flex;justify-content:space-between;gap:2mm;align-items:baseline;break-after:avoid}.detail-item-head h3{min-width:0;overflow-wrap:anywhere}.detail-item-head>span{font-size:7pt;text-align:right;flex-shrink:0;max-width:45%;overflow-wrap:anywhere}.detail-item p{font-size:8pt;margin:.8mm 0 1mm}.source{font-size:6.9pt;display:block;margin:.4mm 0;color:#7c686d}.choice{font-style:italic}.detail-section h2{padding-top:1.5mm;font-size:9.5pt}table{width:100%;border-collapse:collapse;font-size:8pt;table-layout:fixed}thead{display:table-header-group}th{text-align:left;font-size:7.2pt;color:#7c686d;border-bottom:.6pt solid #792b34;padding:1.5mm 1mm}td{padding:2mm 1mm;border-bottom:.5pt solid #e5dadd;vertical-align:top;overflow-wrap:anywhere}tr{break-inside:avoid}td p{font-size:7.5pt;margin:1mm 0}td small{display:block}.number{font-variant-numeric:tabular-nums;white-space:normal}.equipment th:nth-child(1){width:55%}.equipment th:nth-child(2){width:10%}.equipment th:nth-child(3){width:35%}.journal-item{margin-bottom:2mm;break-inside:avoid}.journal-item.long-item{break-inside:auto}.journal-item h3{break-after:avoid}.stories{margin-top:2mm}.stories p{font-size:9pt;orphans:3;widows:3;margin:1mm 0}.stories .detail-section{break-inside:auto}.extra-trait-note{font-size:7.5pt;margin:1.5mm 0}.rating-adjusted{font-size:6.8pt;color:#792b34}.spacer{height:1mm}.no-data{min-height:5mm;color:#94848a;font-size:8pt}.reference-note{font-size:7.2pt;line-height:1.4;margin:1.5mm 0;color:#77686b}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `;


  // Field names verified against the supplied official four-page AcroForm.
  const officialLayout = {"text":["name","player","chronicle","nature","demeanor","concept","clan","gen","sire","combat1","combat7","combat13","combat19","combat25","combat31","combat37","armor1","armor2","armor3","armor4","armor5","armor6","combat2","combat8","combat14","combat20","combat26","combat32","combat38","combat3","combat9","combat15","combat21","combat27","combat33","combat39","combat4","combat10","combat16","combat22","combat28","combat34","combat40","combat5","combat11","combat17","combat23","combat29","combat35","combat41","combat6","combat12","combat18","combat24","combat30","combat36","combat42","attrib1","attrib2","attrib3","attrib4","attrib5","attrib6","attrib7","attrib8","attrib9","abilities1","abilities2","abilities3","abilities4","abilities5","abilities6","abilities7","abilities8","abilities9","abilities10","abilities31","abilities11","abilities12","abilities13","abilities14","abilities15","abilities16","abilities17","abilities18","abilities19","abilities20","abilities32","abilities21","abilities22","abilities23","abilities24","abilities25","abilities26","abilities27","abilities28","abilities29","abilities30","abilities33","disciplines1","disciplines2","disciplines3","disciplines4","disciplines5","back1","back2","back3","back4","back5","virtue2","virtue3","virtue1","bearing2","bearing1","pathofenlight","misc2","misc3","misc4","misc5","misc6","misc7","misc8","misc9","misc10","misc11","misc12","weakness","merits1","merits2","merits3","merits4","merits5","merits6","merits7","merits8","merits9","merits10","merits11","merits12","merits13","merits14","merits15","merits16","merits17","merits18","merits19","merits20","merits21","flaws1","flaws2","flaws3","flaws4","flaws5","flaws6","flaws7","flaws8","flaws9","flaws10","flaws11","flaws12","flaws13","flaws14","flaws15","flaws16","flaws17","flaws18","flaws19","flaws20","flaws21","ot1","ot2","ot3","ot4","ot5","ot6","ot7","ot8","ot9","rituals1","rituals2","rituals3","rituals4","rituals5","rituals6","rituals7","rituals8","rituals9","rituals10","rituals11","rituals12","paths1","paths2","paths3","paths4","paths5","paths6","paths7","exp1","exp2","exp3","exp4","exp5","exp6","exp7","derangements1","derangements2","derangements3","derangements4","derangements5","derangements6","derangements7","misc1","eb1","eb2","eb3","eb4","eb5","eb6","eb7","eb8","eb9","eb10","eb11","eb12","eb13","eb14","eb15","eb16","eb17","eb18","eb19","eb20","eb21","eb22","eb23","eb24","eb25","eb26","eb27","eb28","eb29","eb30","eb31","possessions1","possessions2","possessions3","possessions4","possessions5","possessions6","possessions7","possessions8","possessions9","possessions10","possessions11","possessions12","possessions13","possessions14","possessions15","possessions16","possessions17","possessions18","haven1","haven2","haven3","haven4","haven5","haven6","haven7","haven8","history1","history2","history3","history4","history5","history6","history7","history8","history9","history10","history11","history12","history13","description1","description2","description3","description4","description5","description6","description7","description8","description9","description10","description11","description12","description13","description14","description15","description16","description17","description18","description19","description20","description21","description22"],"checks":["dot1","dot2","dot3","dot4","dot5","dot6","dot7","dot8","dot9","dot10","dot11","dot12","dot13","dot14","dot15","dot16","dot17","dot18","dot19","dot20","dot21","dot22","dot23","dot24","dot8a","dot16a","dot24a","dot25","dot26","dot27","dot28","dot29","dot30","dot31","dot32","dot33","dot34","dot35","dot36","dot37","dot38","dot39","dot40","dot41","dot42","dot43","dot44","dot45","dot46","dot47","dot48","dot32a","dot40a","dot48a","dot49","dot50","dot51","dot52","dot53","dot54","dot55","dot56","dot57","dot58","dot59","dot60","dot61","dot62","dot63","dot64","dot65","dot66","dot67","dot68","dot69","dot70","dot71","dot72","dot56a","dot64a","dot72a","dot73","dot74","dot75","dot76","dot77","dot78","dot79","dot80","dot81","dot82","dot83","dot84","dot85","dot86","dot87","dot88","dot89","dot90","dot91","dot92","dot93","dot94","dot95","dot96","dot97","dot98","dot99","dot100","dot101","dot102","dot103","dot104","dot105","dot106","dot107","dot108","dot109","dot110","dot111","dot112","dot113","dot114","dot115","dot116","dot117","dot118","dot119","dot120","dot121","dot122","dot123","dot124","dot125","dot126","dot127","dot128","dot129","dot130","dot131","dot132","dot133","dot134","dot135","dot136","dot137","dot138","dot139","dot140","dot141","dot142","dot143","dot144","dot145","dot146","dot147","dot148","dot149","dot150","dot151","dot152","dot145q","dot146q","dot147q","dot148q","dot149q","dot150q","dot151q","dot152q","dot80a","dot88a","dot96a","dot104a","dot112a","dot120a","dot128a","dot136a","dot144a","dot152a","dot152qa","dot153","dot154","dot155","dot156","dot157","dot158","dot159","dot160","dot161","dot162","dot163","dot164","dot165","dot166","dot167","dot168","dot169","dot170","dot171","dot172","dot173","dot174","dot175","dot176","dot177","dot178","dot179","dot180","dot181","dot182","dot183","dot184","dot185","dot186","dot187","dot188","dot189","dot190","dot191","dot192","dot193","dot194","dot195","dot196","dot197","dot198","dot199","dot200","dot201","dot202","dot203","dot204","dot205","dot206","dot207","dot208","dot209","dot210","dot211","dot212","dot213","dot214","dot215","dot216","dot217","dot218","dot219","dot220","dot221","dot222","dot223","dot224","dot225","dot226","dot227","dot228","dot229","dot230","dot231","dot232","dot225q","dot226q","dot227q","dot228q","dot229q","dot230q","dot231q","dot232q","dot160a","dot168a","dot176a","dot184a","dot192a","dot200a","dot208a","dot216a","dot224a","dot232a","dot232qa","dot233","dot234","dot235","dot236","dot237","dot238","dot239","dot240","dot241","dot242","dot243","dot244","dot245","dot246","dot247","dot248","dot249","dot250","dot251","dot252","dot253","dot254","dot255","dot256","dot257","dot258","dot259","dot260","dot261","dot262","dot263","dot264","dot265","dot266","dot267","dot268","dot269","dot270","dot271","dot272","dot273","dot274","dot275","dot276","dot277","dot278","dot279","dot280","dot281","dot282","dot283","dot284","dot285","dot286","dot287","dot288","dot289","dot290","dot291","dot292","dot293","dot294","dot295","dot296","dot297","dot298","dot299","dot300","dot301","dot302","dot303","dot304","dot305","dot306","dot307","dot308","dot309","dot310","dot311","dot312","dot305q","dot306q","dot307q","dot308q","dot309q","dot310q","dot311q","dot312q","dot240a","dot248a","dot256a","dot264a","dot272a","dot280a","dot288a","dot296a","dot304a","dot312a","dot312qa","dot409","dot410","dot411","dot412","dot413","dot414","dot415","dot416","dot417","dot418","dot419","dot420","dot421","dot422","dot423","dot313","dot314","dot315","dot316","dot317","dot318","dot319","dot320","dot321","dot322","dot323","dot324","dot325","dot326","dot327","dot328","dot329","dot330","dot331","dot332","dot333","dot334","dot335","dot336","dot337","dot338","dot339","dot340","dot341","dot342","dot343","dot344","dot345","dot346","dot347","dot348","dot349","dot350","dot351","dot352","dot320a","dot328a","dot336a","dot344a","dot352a","dot361","dot362","dot363","dot364","dot365","dot366","dot367","dot368","dot369","dot370","dot371","dot372","dot373","dot374","dot375","dot376","dot377","dot378","dot379","dot380","dot381","dot382","dot383","dot384","dot385","dot386","dot387","dot388","dot389","dot390","dot391","dot392","dot393","dot394","dot395","dot396","dot397","dot398","dot399","dot400","dot368a","dot376a","dot384a","dot392a","dot400a","hdot1","hdot2","hdot3","hdot4","hdot5","hdot6","hdot7","hdot8","hdot9","hdot10","willdot1","willdot2","willdot3","willdot4","willdot5","willdot6","willdot7","willdot8","willdot9","willdot10","check1","check2","check3","check4","check5","check6","check7","check8","check9","check10","check11","check12","check13","check14","check15","check16","check17","check18","check19","check20","check21","check22","check23","check24","check25","check26","check27","check28","check29","check30","check31","check32","check33","check34","check35","check36","check37","check38","check39","check40","check41","check42","check43","check44","check45","check46","check47","check48","check49","check50","check51","check52","check53","check54","check55","check56","check57","check58","check59","check60","dot537","dot538","dot539","dot540","dot541","dot542","dot543","dot544","dot545","dot546","dot547","dot548","dot549","dot550","dot551","dot552","dot553","dot554","dot555","dot556","dot557","dot558","dot559","dot560","dot544a","dot552a","dot560a","dot561","dot562","dot563","dot564","dot566","dot567","dot568","dot569","dot570","dot571","dot572","dot573","dot574","dot575","dot576","dot577","dot578","dot579","dot580","dot581","dot582","dot583","dot584","dot585","dot569a","dot577a","dot585a","dot586","dot587","dot588","dot589","dot590","dot591","dot592","dot593","dot594","dot595","dot596","dot597","dot598","dot599","dot600","dot601","dot602","dot603","dot604","dot605","dot606","dot607","dot608","dot609","dot593a","dot601a","dot609a","dot610","dot611","dot612","dot613","dot614","dot615","dot616","dot617","dot618","dot619","dot620","dot621","dot622","dot623","dot624","dot625","dot626","dot627","dot628","dot629","dot630","dot631","dot632","dot633","dot634","dot635","dot636","dot637","dot638","dot639","dot630a","dot631a","dot632a","dot633a","dot634a","chart","sketch"],"health":["health1","health2","health3","health4","health5","health6","health7"]};

  function html(character, Rules) {
    const c = character || {}, calc = typeof Rules?.calculate === 'function' ? Rules.calculate(c) : {};
    const attrs = c.attributes || c.attrs || {}, abilities = c.abilities || {}, effectiveAttrs = calc.effective?.attributes || calc.attributes || calc.attrs || attrs, effectiveAbilities = calc.effective?.abilities || calc.abilities || abilities;
    const types = c.virtueTypes || {}, virtues = c.virtues || {}, roadScore = num(calc.roadScore ?? c.roadScore), willpower = num(calc.willpowerMax ?? c.willpower ?? calc.willpower), currentWillpower = num(c.resources?.willpower ?? c.currentWillpower, willpower);
    const allCoreKeys = new Set(abilityGroups.flatMap(x => x[1].map(a => a[0]))), extraAbilities = Object.entries(abilities).filter(([key, value]) => !allCoreKeys.has(key) && rating(value) !== 0).map(([key, value]) => ({name: abilityNames[key] || key, rating: rating(value)}));
    const specialty = c.specialties || {};
    const primaryTrait = (key, label, values, base) => `<div class="trait-row"><span>${esc(Rules?.labels?.[key] || label)}${specialty[key] ? ` <small>(${esc(specialty[key])})</small>` : ''}</span>${dots(rating(base[key]), 5)}</div>${rating(values[key]) !== rating(base[key]) ? `<small class="rating-adjusted">Dados atuais ${format(rating(values[key]))}; ajuste ${num(rating(values[key]) - rating(base[key])) >= 0 ? '+' : ''}${format(rating(values[key]) - rating(base[key]))}</small>` : ''}`;
    const warnings = list(calc.warnings).map(w => typeof w === 'object' ? w.message || w.text || JSON.stringify(w) : w);
    const creationIssues = warnings.slice(0, 3), remainingIssues = warnings.slice(3);
    const weakness = c.weakness || calc.weakness || calc.clanWeakness || '';
    const weaknessPreview = typeof weakness === 'string' && weakness.length > 240 ? weakness.slice(0, 235) + '… (texto completo nas páginas seguintes)' : weakness;
    const creationNote = c.creation?.phase === 'play' ? 'Valores atuais da crônica.' : 'Ficha em criação. Confira a distribuição e a aprovação do narrador.';
    const otherTraits = list(c.otherTraits).concat(extraAbilities);
    const date = new Date().toLocaleDateString('pt-BR');
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><title>${esc(c.name || 'Personagem')} - Sangue &amp; Cinzas</title><style>${css}</style></head><body>
      <section class="sheet-one">
        <header class="masthead">${portrait(c)}<div><div class="brand">SANGUE &amp; CINZAS</div><h1>${esc(c.name || 'Personagem sem nome')}</h1><div class="edition">Vampiro: Idade das Trevas · V20 Dark Ages</div>${c.concept ? `<p class="concept">${esc(c.concept)}</p>` : ''}</div></header>
        <div class="identity">${[['Jogador', c.player], ['Natureza', c.nature], ['Clã / linhagem', c.clan], ['Crônica', c.chronicle || c.campaign], ['Comportamento', c.demeanor], ['Geração', `${format(c.generation || calc.generation || 12)}ª`], ['Senhor', c.sire], ['Facção', c.sect], ['Abraço', c.embrace]].map(x => field(x[0], x[1])).join('')}</div>
        ${title('Atributos')}<div class="triple">${attributeGroups.map(([heading, rows]) => `<section><div class="group-title">${heading}</div>${rows.map(([key, label]) => primaryTrait(key, label, effectiveAttrs, attrs)).join('')}</section>`).join('')}</div>
        ${title('Habilidades')}<div class="triple">${abilityGroups.map(([heading, rows]) => `<section><div class="group-title">${heading}</div>${rows.map(([key, label]) => primaryTrait(key, label, effectiveAbilities, abilities)).join('')}</section>`).join('')}</div>
        ${extraAbilities.length ? `<p class="extra-trait-note">Habilidades adicionais: ${extraAbilities.map(i => `${esc(i.name)} ${format(i.rating)}`).join(' · ')}</p>` : ''}
        ${title('Vantagens')}<div class="triple advantages"><section><div class="group-title">Disciplinas</div>${traitRows(c.disciplines, {limit: 5})}</section><section><div class="group-title">Antecedentes</div>${traitRows(c.backgrounds, {limit: 5})}</section><section class="virtue-list"><div class="group-title">Virtudes</div>${[[virtueNames[types.moral || 'conscience'], virtues.moral ?? virtues.conscience ?? virtues.conviction], [virtueNames[types.restraint || 'selfControl'], virtues.restraint ?? virtues.selfControl ?? virtues.instinct], ['Coragem', virtues.courage]].map(([label, value]) => `<div class="trait-row"><span>${esc(label)}</span>${dots(rating(value), 5)}</div>`).join('')}</section></div>
        <div class="resources"><div><div class="resource-pair"><section>${title('Caminho')}<div class="resource-name">${esc(named(c.road))}</div>${dots(roadScore, 10)}${c.aura || calc.aura ? `<small>Aura: ${esc(c.aura || calc.aura)}</small>` : ''}</section><section>${title('Força de Vontade')}${dots(willpower, 10)}<p class="resource-current">Atual: <b>${esc(format(currentWillpower))} / ${esc(format(willpower))}</b></p></section></div>${bloodBlock(c, calc)}${weaknessPreview ? `<div class="weakness"><b>Fraqueza de clã:</b> ${esc(named(weaknessPreview, ''))}</div>` : ''}${c.bloodPreference ? `<p class="health-key"><b>Preferência de sangue:</b> ${esc(c.bloodPreference)}</p>` : ''}${list(c.conditions).length ? `<p class="health-key"><b>Condições:</b> ${c.conditions.map(esc).join(' · ')}</p>` : ''}</div>${healthBlock(c, calc)}</div>
        ${calculations(c, calc)}${creationIssues.length ? `<p class="warning"><b>Conferência:</b> ${creationIssues.map(esc).join(' ')}</p>` : ''}
        <footer class="footer">${esc(creationNote)} Círculos indicam os valores permanentes; os dados atuais incluem os modificadores e dados passivos registrados.<br>Ficha pessoal · ${date} · Regras DAV20; ficha oficial usada como referência de organização.</footer>
      </section>
      <section class="sheet-two"><header class="page-heading">${esc(c.name || 'Personagem sem nome')}<small>Vantagens, equipamento e registros da crônica</small></header>
        <div class="details-two"><div>${traitDetail(c.disciplines, 'Disciplinas', {clan: true})}${traitDetail(c.paths, 'Trilhas de feitiçaria')}${traitDetail(c.rituals, 'Rituais')}${traitDetail(c.merits, 'Qualidades', {cost: true})}</div><div>${traitDetail(c.backgrounds, 'Antecedentes')}${traitDetail(c.flaws, 'Defeitos', {cost: true, flaw: true})}${traitDetail(otherTraits, 'Outras características')}${typeof weakness === 'string' && weakness.length > 240 ? `<section class="detail-section">${title('Fraqueza de clã')}${paragraph(weakness)}</section>` : ''}</div></div>
        ${bonusDetails(c)}${inventoryDetails(c)}${remainingIssues.length ? `<section class="detail-section">${title('Conferências adicionais')}${remainingIssues.map(w => paragraph(w, 'warning')).join('')}</section>` : ''}${storyDetails(c)}
        ${!list(c.disciplines).length && !list(c.backgrounds).length && !list(c.merits).length && !list(c.flaws).length && !list(c.inventory).length && !storyDetails(c) ? '<p class="no-data">Acrescente vantagens, equipamentos e anotações para completar os registros da crônica.</p>' : ''}
        <p class="reference-note">Fontes: páginas no arquivo PDF. Valores numéricos prevalecem sobre os círculos. Confira regras contextuais com o narrador.</p>
        <footer class="footer">Sangue &amp; Cinzas · Projeto independente para uso pessoal. Vampire: The Dark Ages e os livros de referência pertencem aos seus respectivos titulares.</footer>
      </section>
    </body></html>`;
  }

  function normalize(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function wrappedLines(text, width) {
    const out = [];
    for (const paragraph of String(text || '').split(/\r?\n/)) {
      if (!paragraph.trim()) { out.push(''); continue; }
      let current = '';
      for (const word of paragraph.trim().split(/\s+/)) {
        if (current && current.length + word.length + 1 > width) { out.push(current); current = ''; }
        if (word.length > width) {
          if (current) { out.push(current); current = ''; }
          for (let i = 0; i < word.length; i += width) out.push(word.slice(i, i + width));
        } else current += (current ? ' ' : '') + word;
      }
      if (current) out.push(current);
    }
    return out;
  }
  function officialWarnings(character, Rules) {
    const c = character || {}, calc = typeof Rules?.calculate === 'function' ? Rules.calculate(c) : {}, out = [];
    for (const [key, max, label] of [['disciplines', 5, 'disciplinas'], ['backgrounds', 5, 'antecedentes'], ['merits', 7, 'qualidades'], ['flaws', 7, 'defeitos'], ['rituals', 6, 'rituais'], ['paths', 7, 'trilhas'], ['otherTraits', 9, 'outras características']]) {
      if (list(c[key]).length > max) out.push(`A ficha oficial comporta ${max} ${label}; ${c[key].length - max} registro(s) adicional(is) ficam no PDF completo.`);
    }
    const carried = list(c.inventory).filter(i => i.equipped !== false), owned = list(c.inventory).filter(i => i.equipped === false);
    if (carried.length > 5 || owned.length > 5) out.push('A ficha oficial comporta 5 equipamentos carregados e 5 guardados; os demais ficam no PDF completo.');
    if (list(c.inventory).filter(i => i.damage != null || i.difficulty != null || i.weapon === true).length > 6) out.push('A ficha oficial comporta 6 armas/ataques; os demais ficam no PDF completo.');
    if ([...Object.values(c.attributes || {}), ...Object.values(c.abilities || {}), ...list(c.disciplines).map(rating), ...list(c.backgrounds).map(rating)].some(x => rating(x) > 9)) out.push('A ficha oficial tem 9 círculos por característica; valores maiores aparecem em números nos campos de especialidade/nome.');
    if ([...Object.values(c.virtues || {}), ...list(c.paths).map(rating)].some(x => rating(x) > 5)) out.push('A ficha oficial tem 5 círculos por Virtude/Trilha. Valores superiores ficam no PDF completo.');
    if (wrappedLines(c.history || c.story, 105).length > 10) out.push('A história ultrapassa as 10 linhas da ficha oficial. O PDF completo conserva todo o texto.');
    if (wrappedLines(c.appearance, 62).length > 11) out.push('A descrição ultrapassa as 11 linhas da ficha oficial. O PDF completo conserva todo o texto.');
    if (c.notes || list(c.bonuses).length || list(c.journal).length || list(c.experience?.ledger).length > 5 || [...list(c.disciplines), ...list(c.merits), ...list(c.flaws), ...list(c.paths), ...list(c.rituals)].some(i => i.notes || i.book)) out.push('Fontes, notas detalhadas, modificadores e diário são incluídos no PDF completo; o formulário oficial oferece espaço limitado para esses registros.');
    if (c.portrait) out.push('O retrato é incluído no PDF completo. A ficha oficial mantém o espaço original para desenho.');
    return out;
  }
  function officialFields(character, Rules) {
    const c = character || {}, calc = typeof Rules?.calculate === 'function' ? Rules.calculate(c) : {}, fields = {};
    for (const name of officialLayout.text) fields[name] = '';
    for (const name of officialLayout.checks) fields[name] = false;
    for (const name of officialLayout.health) fields[name] = ' ';
    const set = (key, value) => { if (Object.hasOwn(fields, key)) fields[key] = typeof value === 'boolean' ? value : String(value == null ? '' : value); };
    const mark = (names, value) => { const n = rating(value); names.forEach((name, i) => set(name, i < n)); };
    const nineDots = (start, suffix = '') => Array.from({length: 8}, (_, i) => `dot${start + i}${suffix}`).concat(`dot${start + 7}${suffix}a`);
    const fillLines = (prefix, start, length, text, width) => wrappedLines(text, width).slice(0, length).forEach((line, i) => set(prefix + (start + i), line));
    const effectiveAttrs = c.attributes || {}, effectiveAbilities = c.abilities || {};
    const attrs = attributeGroups.flatMap(x => x[1]), abilities = abilityGroups.flatMap(x => x[1]);
    for (const [key, value] of Object.entries({name: c.name, player: c.player, chronicle: c.chronicle, nature: c.nature, demeanor: c.demeanor, concept: c.concept, clan: named(c.clan, ''), gen: c.generation, sire: c.sire})) set(key, value);
    attrs.forEach(([key], i) => {
      const value = rating(effectiveAttrs[key]); mark(nineDots(1 + i * 8), value);
      set('attrib' + (i + 1), value > 9 ? `${format(value)}` : c.specialties?.[key] || '');
    });
    abilities.forEach(([key], i) => {
      const value = rating(effectiveAbilities[key]); mark(nineDots(73 + i * 8), value);
      set('abilities' + (i + 1), value > 9 ? `${format(value)}` : c.specialties?.[key] || '');
    });
    list(c.otherAbilities).slice(0, 3).forEach((item, i) => { const start = [145, 225, 305][i]; set('abilities' + (31 + i), named(item, '')); mark(nineDots(start, 'q'), rating(item)); });
    for (const [key, prefix, start] of [['disciplines', 'disciplines', 313], ['backgrounds', 'back', 361]]) list(c[key]).slice(0, 5).forEach((item, i) => {
      const value = rating(item); set(prefix + (i + 1), `${named(item, '')}${value > 9 ? ` [${format(value)}]` : ''}`); mark(nineDots(start + i * 8), value);
    });
    [c.virtues?.moral, c.virtues?.restraint, c.virtues?.courage].forEach((value, i) => mark(Array.from({length: 5}, (_, n) => 'dot' + (409 + i * 5 + n)), value));
    // Tiny virtue text fields are specialty slots, not labels; their fixed bilingual labels stay intact.
    set('pathofenlight', named(c.road, '')); mark(Array.from({length: 10}, (_, i) => 'hdot' + (i + 1)), calc.roadScore ?? c.roadScore);
    mark(Array.from({length: 10}, (_, i) => 'willdot' + (i + 1)), calc.willpowerMax ?? c.willpower);
    mark(Array.from({length: 10}, (_, i) => 'check' + (i + 1)), c.resources?.willpower);
    mark(Array.from({length: 50}, (_, i) => 'check' + (i + 11)), c.resources?.blood);
    set('bearing1', named(c.aura || calc.aura, '')); set('bearing2', calc.auraModifier ?? c.auraModifier ?? '');
    set('weakness', c.weakness || calc.clanWeakness || calc.weakness || '');
    const health = orderedHealth(c.health); health.types.forEach((type, i) => set('health' + (i + 1), type === 'aggravated' ? '*' : type === 'lethal' ? 'X' : '/'));
    const misc = [
      `Sangue: ${format(c.resources?.blood)} / ${calc.bloodMax === null ? 'não definido' : format(calc.bloodMax ?? 10)}; por turno: ${calc.bloodPerTurn === null ? 'não definido' : format(calc.bloodPerTurn ?? 1)}`,
      `Vontade atual: ${format(c.resources?.willpower)} / ${format(calc.willpowerMax ?? c.willpower)}`,
      `Virtudes: ${virtueNames[c.virtueTypes?.moral || 'conscience']}; ${virtueNames[c.virtueTypes?.restraint || 'selfControl']}`,
      `Estado: ${c.health?.state === 'torpor' ? 'Torpor' : c.health?.state === 'finalDeath' ? 'Morte final' : 'Ativo'}`,
      ...list(c.bonuses).slice(0, 5).map(b => `${b.enabled === false ? 'Inativo' : 'Ativo'}: ${b.name || b.source || targetLabel(b.target)} ${num(b.value) >= 0 ? '+' : ''}${format(b.value)}`),
      c.notes ? 'Notas e fontes: consulte o PDF completo.' : ''
    ].filter(Boolean);
    misc.slice(0, 12).forEach((text, i) => set('misc' + (i + 1), text));
    for (const key of ['merits', 'flaws']) list(c[key]).slice(0, 7).forEach((item, i) => { set(key + (i + 1), named(item, '')); set(key + (i + 8), item.type || item.category || ''); set(key + (i + 15), format(item.cost ?? item.points)); });
    list(c.rituals).slice(0, 6).forEach((item, i) => {set('rituals' + (i + 1), named(item, '')); set('rituals' + (i + 7), format(rating(item)));});
    list(c.paths).slice(0, 7).forEach((item, i) => {set('paths' + (i + 1), named(item, '')); const names = i === 6 ? Array.from({length: 5}, (_, n) => 'dot' + (630 + n) + 'a') : Array.from({length: 5}, (_, n) => 'dot' + (610 + i * 5 + n)); mark(names, rating(item));});
    const otherStarts = [[537,538,539,540,541,542,543,544,'544a'],[545,546,547,548,549,550,551,552,'552a'],[553,554,555,556,557,558,559,560,'560a'],[561,562,563,564,566,567,568,569,'569a'],[570,571,572,573,574,575,576,577,'577a'],[578,579,580,581,582,583,584,585,'585a'],[586,587,588,589,590,591,592,593,'593a'],[594,595,596,597,598,599,600,601,'601a'],[602,603,604,605,606,607,608,609,'609a']];
    list(c.otherTraits).slice(0, 9).forEach((item, i) => {set('ot' + (i + 1), named(item, '')); mark(otherStarts[i].map(n => 'dot' + n), rating(item));});
    set('exp1', format(c.experience?.total)); set('exp2', format(c.experience?.spent));
    list(c.experience?.ledger).slice(0, 5).forEach((entry, i) => set('exp' + (i + 3), `${entry.name || entry.description || entry.label || entry.trait || 'Evolução'}: ${format(entry.cost ?? entry.points)} XP`));
    fillLines('derangements', 1, 7, Array.isArray(c.derangements) ? c.derangements.map(i => named(i, '')).join('\n') : c.derangements, 45);
    const weapons = list(c.inventory).filter(i => i.damage != null || i.difficulty != null || i.weapon === true).slice(0, 6);
    weapons.forEach((item, i) => [['name',0],['difficulty',6],['damage',12],['range',18],['rate',24],['clip',30],['conceal',36]].forEach(([key, offset]) => set('combat' + (1 + i + offset), item[key])));
    const armor = list(c.inventory).find(i => i.armor != null || i.type === 'armor');
    if (armor) {set('armor1', armor.name);set('armor2', armor.armor ?? armor.rating);set('armor3', armor.penalty);fillLines('armor',4,3,armor.notes,23);}
    const backgroundSlots = [['allies','aliados',1],['contacts','contatos',4],['fame','fama',7],['herd','rebanho',10],['influence','influencia',13],['mentor','mentor',16],['resources','recursos',19],['retainers','lacaios',22],['status','status',25]];
    for (const [english, portuguese, start] of backgroundSlots) { const item = list(c.backgrounds).find(i => [english,portuguese].includes(normalize(i.name))); if (item) fillLines('eb',start,3,item.notes,45); }
    const customBackground = list(c.backgrounds).find(i => !backgroundSlots.some(([english,portuguese]) => [english,portuguese].includes(normalize(i.name))) && i.notes);
    if (customBackground) {set('eb28', customBackground.name);fillLines('eb',29,3,customBackground.notes,45);}
    const carried = list(c.inventory).filter(i => i.equipped !== false), owned = list(c.inventory).filter(i => i.equipped === false);
    carried.slice(0,5).forEach((i,n) => set('possessions' + (n + 1), `${i.name || 'Item'}${num(i.quantity,1) > 1 ? ` ×${format(i.quantity)}` : ''}`));
    owned.slice(0,5).forEach((i,n) => set('possessions' + (n + 10), `${i.name || 'Item'}${num(i.quantity,1) > 1 ? ` ×${format(i.quantity)}` : ''}`));
    fillLines('possessions',6,4,c.feedingGrounds,45);fillLines('possessions',15,4,c.transportation,45);
    fillLines('haven',1,4,c.havenLocation || c.haven,30);fillLines('haven',5,4,c.havenDescription,64);
    fillLines('history',1,10,c.history || c.story,105);fillLines('history',11,3,c.goals,105);
    for (const [field,value] of [['description1',c.age],['description2',c.apparentAge],['description3',c.birth],['description4',c.embrace],['description5',c.hair],['description6',c.eyes],['description7',c.ethnicity],['description8',c.nationality],['description9',c.height],['description10',c.weight],['description11',c.sex]]) set(field,value);
    fillLines('description',12,11,c.appearance,62);
    return fields;
  }

  return {html, officialFields, officialWarnings, esc};
});
