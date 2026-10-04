#!/usr/bin/env python3
"""Build a local source index. Only small reviewed choices load in the UI.

Run after pdftotext -layout and pdftohtml -xml extraction. Companion OCR is
cached in referencias/companion-ocr/page-*.txt, never performed at app startup.
Page numbers throughout are the PDF's one-based page index, not printed folios.
"""
import collections
import hashlib
import json
import re
import shutil
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'referencias'
DATA = ROOT / 'app/data'
BOOKS = [
    dict(id='core', title='V20 Dark Ages - Livro básico', file='core.pdf', pages=476, language='en', source='(VtDA 20) Vampire the Dark Ages 20AE.pdf'),
    dict(id='companion', title='V20 Dark Ages Companion - tradução fornecida', file='companion.pdf', pages=133, language='pt', machineTranslated=True, source='ilide.info-vtda-20th-companion-traduzido-pr_af75b86126bde0a0daf24e1c420523be.pdf'),
    dict(id='secrets', title='V20 Dark Ages - Tome of Secrets', file='secrets.pdf', pages=119, language='en', source='ilide.info-v20-dark-ages-tome-of-secrets-pdf-pr_f44e9bc4424601a27afaa8c65b0129e7.pdf'),
    dict(id='sheet', title='Ficha oficial DAV20 - quatro páginas', file='ficha-oficial.pdf', pages=4, language='en', source='DAV20_4-Page_Official_Interactive.pdf'),
]

DISCIPLINES = [
 ('Abombwe','Abombwe',190),('Animalism','Animalismo',192),('Auspex','Auspícios',195),
 ('Bardo','Bardo',201),('Celerity','Rapidez',203),('Chimerstry','Quimerismo',205),
 ('Daimonion','Daimonion',209),('Dementation','Demência',213),('Dominate','Dominação',218),
 ('Flight','Voo',222),('Fortitude','Fortitude',222),('Mytherceria','Mytherceria',223),
 ('Obfuscate','Ofuscação',225),('Obtenebration','Tenebrosidade',229),('Ogham','Ogham',232),
 ('Potence','Potência',235),('Presence','Presença',236),('Protean','Metamorfose',241),
 ('Quietus (Cruscitus)','Quietus (Cruscitus)',245),('Quietus (Hematus)','Quietus (Hematus)',249),
 ('Serpentis','Serpentis',253),('Spiritus','Spiritus',255),('Temporis','Temporis',257),
 ('Valeren (Healer)','Valeren (Curador)',261),('Valeren (Warrior)','Valeren (Guerreiro)',263),
 ('Valeren (Watcher)','Valeren (Vigilante)',266),('Vicissitude','Vicissitude',268),
 ('Abyss Mysticism','Misticismo do Abismo',272),('Koldunic Sorcery','Feitiçaria Koldúnica',275),
 ('Necromancy','Necromancia',279),('Thaumaturgy','Taumaturgia',297),
]

CLANS = [
 ('Assamite (Vizier)','Assamita (Vizir)',43,['Auspex','Presence','Quietus (Hematus)'],'Obsessão ligada à habilidade intelectual ou criativa mais alta; a aura denuncia essa fixação. A pele escurece com a idade.'),
 ('Brujah','Brujah',45,['Celerity','Potence','Presence'],'Dificuldade +2 para resistir ou orientar o frenesi; não pode gastar Força de Vontade para evitá-lo.'),
 ('Cappadocian','Capadócio',47,['Auspex','Fortitude','Necromancy'],'Aparência pálida e cadavérica; sangue não permite simular a aparência dos vivos.'),
 ('Gangrel','Gangrel',49,['Animalism','Fortitude','Protean'],'O frenesi deixa características animais físicas ou mentais; consulte o acúmulo e duração na fonte.'),
 ('Lasombra','Lasombra',51,['Dominate','Obtenebration','Potence'],'Ausência de reflexo e um nível adicional de dano agravado por exposição ao sol.'),
 ('Malkavian','Malkaviano',53,['Auspex','Dementation','Obfuscate'],'Escolha uma perturbação permanente; Força de Vontade só pode suprimi-la temporariamente.'),
 ('Nosferatu','Nosferatu',55,['Animalism','Obfuscate','Potence'],'Aparência 0, impossível de elevar. Primeiras impressões falham automaticamente, salvo intimidação.'),
 ('Ravnos','Ravnos',57,['Animalism','Chimerstry','Fortitude'],'Defina um traço fundamental que provoca compulsão quando aparece uma oportunidade; consulte o teste na fonte.'),
 ('Setite','Seguidor de Set',59,['Obfuscate','Presence','Serpentis'],'Sofre o dobro do dano agravado causado por exposição ao sol.'),
 ('Toreador','Toreador',61,['Auspex','Celerity','Presence'],'Pode ficar fascinado por beleza; determine com o Narrador os gatilhos e o teste para sair do transe.'),
 ('Tremere','Tremere',63,['Auspex','Dominate','Thaumaturgy'],'A primeira ingestão de sangue de outro Cainita vale como duas para o laço de sangue.'),
 ('Tzimisce','Tzimisce',65,['Animalism','Auspex','Vicissitude'],'Precisa dormir com terra de um local importante. Sem ela, as paradas são reduzidas cumulativamente.'),
 ('Ventrue','Ventrue',67,['Dominate','Fortitude','Presence'],'Só recebe sustento de um tipo específico de mortal; registre a preferência alimentar.'),
 ('Ahrimane','Ahrimane',71,['Animalism','Potence','Spiritus'],'Seu sangue não pode criar laços de sangue nem carniçais.'),
 ('Anda','Anda',73,['Animalism','Fortitude','Protean'],'Na primeira hora após o pôr do sol e na última antes da aurora, as paradas são limitadas pelo Caminho.'),
 ('Baali','Baali',75,['Daimonion','Presence','Obfuscate'],'Símbolos religiosos não abandonados tornam a Fé Verdadeira de quem os exibe um ponto maior contra você.'),
 ('Bonsam','Bonsam',77,['Abombwe','Obfuscate','Potence'],'A forma verdadeira causa terror em mortais; eles testam Coragem para evitar fugir ou atacar.'),
 ('Children of Osiris','Filhos de Osíris',79,['Bardo'],'Mantém a fraqueza do clã original e perde a capacidade de Abraçar. Escolha outras duas Disciplinas do clã original.'),
 ('Danava','Danava',80,['Dominate','Fortitude','Thaumaturgy'],'Não recebe sustento de sangue animal; sem oferenda ritual prévia, sangue mortal sustenta pela metade.'),
 ('Gargoyle','Gárgula',83,['Flight','Fortitude','Potence'],'Solidão completa reduz as paradas pela metade; Força de Vontade conta dois pontos a menos contra controle mental.'),
 ('Giovani','Giovani',85,['Auspex','Fortitude','Necromancy'],'A maioria mantém a aparência cadavérica dos Capadócios; os próximos de Augustus apresentam um Beijo doloroso. Consulte a variante.'),
 ('Impundulu','Impundulu',87,['Necromancy','Fortitude','Presence'],'Só recebe sustento do sangue de sua parceira Bomkazi.'),
 ('Kiasyd','Kiasyd',89,['Mytherceria'],'Marca feérica perceptível e vulnerabilidade a ferro frio. Escolha outras duas Disciplinas do clã original.'),
 ('Lamiae','Lamiae',91,['Fortitude','Necromancy','Potence'],'O Beijo transmite uma doença; a restrição afeta alimentação e relações com mortais. Consulte a fonte.'),
 ('Lhiannan','Lhiannan',93,['Animalism','Presence','Ogham'],'Abraçar enfraquece a Geração do senhor. Permanecer fora da natureza causa redução cumulativa das paradas.'),
 ('Nagaraja','Nagaraja',95,['Auspex','Dominate','Necromancy'],'Precisa consumir carne humana fresca, além de sangue; possui os Defeitos Ragged Bite e Flesh Eater sem receber pontos.'),
 ('Niktuku','Niktuku',97,['Auspex','Celerity','Potence'],'Sangue mortal fornece apenas um ponto por três drenados; a aparência muda com a idade.'),
 ('Ramanga','Ramanga',99,['Obtenebration','Obfuscate','Presence'],'Presença e Aizina sofrem dificuldade +1 contra vítimas das quais não possua uma parte física.'),
 ('Salubri (Healer)','Salubri (Curador)',101,['Auspex','Presence','Valeren (Healer)'],'Valeren manifesta um terceiro olho. Alimentar-se de alguém relutante exige teste de Força de Vontade.'),
 ('Salubri (Warrior)','Salubri (Guerreiro)',103,['Auspex','Fortitude','Valeren (Warrior)'],'Valeren manifesta um terceiro olho. Alimentar-se exige demonstrar domínio marcial ou enfrentar a fraqueza da casta.'),
 ('Salubri (Watcher)','Salubri (Vigilante)',105,['Auspex','Obfuscate','Valeren (Watcher)'],'Valeren manifesta um terceiro olho. Fixação por um campo de conhecimento exige teste para recusar uma oportunidade de estudo.'),
 ('True Brujah','Verdadeiro Brujah',107,['Potence','Presence','Temporis'],'Dificuldade +2 em Consciência e Convicção, máximo 9; evolução dessas Virtudes e do Caminho custa o dobro de experiência.'),
]

ROADS = [
 ('Road of the Beast','Caminho da Besta',116,['Conviction','Instinct','Courage']),
 ('Road of Heaven','Caminho do Paraíso',120,['Conscience','Self-Control','Courage']),
 ('Road of Humanity','Caminho da Humanidade',122,['Conscience','Self-Control','Courage']),
 ('Road of Kings','Caminho dos Reis',126,['Conviction','Self-Control','Courage']),
 ('Road of Lilith','Caminho de Lilith',129,['Conviction','Instinct','Courage']),
 ('Road of Metamorphosis','Caminho da Metamorfose',132,['Conviction','Instinct','Courage']),
 ('Road of Sin','Caminho do Pecado',134,['Conviction','Instinct','Courage']),
 ('Road of Bones','Caminho dos Ossos',140,['Conviction','Self-Control','Courage']),
 ('Road of Yasa','Caminho de Yasa',141,['Conviction','Self-Control','Courage']),
 ('Path of the Hunter','Trilha do Caçador',118,['Conviction','Instinct','Courage']),
 ('Path of Journeys','Trilha das Jornadas',119,['Conviction','Self-Control','Courage']),
 ('Path of Liberation','Trilha da Libertação',119,['Conviction','Instinct','Courage']),
 ('Path of Breath','Trilha do Sopro',124,['Conscience','Self-Control','Courage']),
 ('Path of Community','Trilha da Comunidade',125,['Conscience','Self-Control','Courage']),
 ('Path of Illumination','Trilha da Iluminação',125,['Conscience','Self-Control','Courage']),
 ('Path of Chivalry','Trilha da Cavalaria',127,['Conscience','Self-Control','Courage']),
 ('Path of Devaraja','Trilha de Devaraja',127,['Conviction','Self-Control','Courage']),
 ('Path of Daena','Trilha de Daena',129,['Conviction','Self-Control','Courage']),
 ('Path of Thorns','Trilha dos Espinhos',131,['Conviction','Instinct','Courage']),
 ('Path of Veils','Trilha dos Véus',132,['Conviction','Instinct','Courage']),
 ('Path of Making','Trilha da Criação',132,['Conviction','Instinct','Courage']),
 ('Path of Pleasure','Trilha do Prazer',136,['Conviction','Instinct','Courage']),
 ('Path of the Devil','Trilha do Diabo',136,['Conviction','Self-Control','Courage']),
 ('Path of Screams','Trilha dos Gritos',137,['Conviction','Instinct','Courage']),
]

BACKGROUND_LABELS = {
 'Allies':'Aliados','Alternate Identity':'Identidade Alternativa','Contacts':'Contatos',
 'Domain':'Domínio','Fame':'Fama','Generation':'Geração','Herd':'Rebanho',
 'Influence':'Influência','Mentor':'Mentor','Resources':'Recursos','Retainers':'Lacaios',
 'Status':'Status','Oubliette':'Oubliette','Martial Training':'Treinamento Marcial',
 'Noble Ancestor':'Ancestral Nobre',
}
ARCHETYPE_LABELS = dict(zip(
 'Architect|Autocrat|Beast|Bon Vivant|Bravo|Caregiver|Celebrant|Chameleon|Child|Competitor|Conformist|Conniver|Curmudgeon|Curious|Dabbler|Deviant|Director|Dreamer|Enigma|Eye of the Storm|Fanatic|Gallant|Guru|Idealist|Jester|Judge|Loner|Martyr|Masochist|Monster|Pedagogue|Penitent|Perfectionist|Rebel|Rogue|Sadist|Soldier|Survivor|Thrill-Seeker|Traditionalist|Visionary'.split('|'),
 'Arquiteto|Autocrata|Besta|Bon Vivant|Valentão|Cuidador|Celebrante|Camaleão|Criança|Competidor|Conformista|Conspirador|Ranzinza|Curioso|Diletante|Desviante|Diretor|Sonhador|Enigma|Olho do Furacão|Fanático|Galante|Guru|Idealista|Bobo|Juiz|Solitário|Mártir|Masoquista|Monstro|Pedagogo|Penitente|Perfeccionista|Rebelde|Trapaceiro|Sádico|Soldado|Sobrevivente|Caçador de Emoções|Tradicionalista|Visionário'.split('|')))
ARCHETYPE_LABELS.update({'Creep Show':'Aberração','Defender':'Defensor','Mercenary':'Mercenário','Philosopher':'Filósofo'})
CATEGORY_KEYS = {'Clãs':'clan','Linhagens':'bloodline','Caminhos':'road','Disciplinas':'discipline','Poderes':'power','Antecedentes':'background','Qualidades':'merit','Defeitos':'flaw','Rituais':'ritual','Trilhas de feitiçaria':'path','Arquétipos':'archetype','Disciplinas combinadas':'combination','Cenário':'setting','Regras':'rule'}
WORD_LEVELS = {'One':1,'Two':2,'Three':3,'Four':4,'Five':5,'Six':6,'Seven':7,'Eight':8,'Nine':9}

def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')

def clean(s):
    s = s.replace('\xad','').replace('ﬀ','ff').replace('ﬁ','fi').replace('ﬂ','fl')
    s = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1\2', s)
    return re.sub(r'[ \t]+', ' ', s).strip()

def title(s):
    # Fonts encode small caps as mixed uppercase and lowercase, not real casing.
    s = clean(s).lower().title().replace('’S', '’s').replace("'S", "'s")
    for word in ['The','Of','And','With','To','In','A','An','For','From','Into']:
        s = re.sub(r'(?<= )'+word+r'(?= )',word.lower(),s)
    return s

def read_layout(book):
    path = REF / f'{book}-layout.xml'
    if not path.exists():
        return [], []
    root = ET.parse(path).getroot()
    fonts = {f.attrib['id']:f.attrib for f in root.findall('.//fontspec')}
    body, heads = [], []
    for page in root.findall('page'):
        pn = int(page.attrib['number']); width = int(page.attrib['width'])
        buckets=[]
        for t in page.findall('text'):
            f=fonts[t.attrib['font']];a=t.attrib
            if int(a['top'])>int(page.attrib['height'])-100 or f.get('color')=='#ffffff':continue
            left,tw,base=int(a['left']),int(a['width']),int(a['top'])+int(a['height'])
            col=int(left>width*.5)
            match=next((b for b in buckets if b['col']==col and abs(b['base']-base)<=8),None)
            if match is None:
                match=dict(col=col,base=base,rows=[]);buckets.append(match)
            match['rows'].append((left,tw,''.join(t.itertext()),f,any(c.tag=='b' for c in t.iter())))
        for b in sorted(buckets,key=lambda x:(x['col'],x['base'])):
            rows=sorted(b['rows'],key=lambda x:x[0]); out='';end=0
            for left,tw,s,f,bold in rows:
                if left-end>5 and out and not out.endswith(' ') and not s.startswith(' '):out+=' '
                out+=s;end=left+tw
            text=clean(out)
            if not text:continue
            ix=len(body); body.append(dict(page=pn,text=text,col=b['col'],base=b['base']))
            caps=[f for _,_,s,f,_ in rows if any(family in f['family'] for family in ['DeRoosCaps-SC','Delavan','Galahad']) and s.strip()]
            if caps and sum(len(s.strip()) for _,_,s,f,_ in rows if f in caps)>=len(text.replace(' ',''))*.75:
                size=max([int(f['size']) for _,_,s,f,_ in rows if f in caps and not s.strip().isdigit()] or [int(f['size']) for f in caps])
                heads.append(dict(page=pn,text=text,ix=ix,col=b['col'],base=b['base'],size=size))
    # Wrapped headings use the same style and adjacent baselines.
    merged=[]
    for h in heads:
        if merged:
            prev=merged[-1]
            if h['page']==prev['page'] and h['col']==prev['col'] and h['ix']==prev['ix']+1 and h['base']-prev['base']<=42 and h['size']==prev['size'] and (prev['size']>=27 or ('•' in prev['text'] and '•' not in h['text']) or h['text'].startswith('(') or prev['text'].endswith(':')):
                prev['text']+=' '+h['text'];continue
        merged.append(h)
    return body,merged

def excerpt(body,head,heads):
    end=next((h['ix'] for h in heads if h['ix']>head['ix']),len(body))
    end=min(end,head['ix']+160)
    return clean('\n'.join(r['text'] for r in body[head['ix']:end]))[:9000]

def build():
    DATA.mkdir(parents=True,exist_ok=True); (ROOT/'app/livros').mkdir(exist_ok=True)
    pages=[]; page_lookup={}; public_books=[]
    for book in BOOKS:
        public={k:v for k,v in book.items() if k!='source'}
        target=ROOT/'app/livros'/book['file']
        if not target.is_file():raise SystemExit('PDF local ausente: '+str(target)+'. Execute import_library.py.')
        texts=(REF/f"{book['id']}.txt").read_text(encoding='utf-8').split('\f')
        assert len(texts)>=book['pages'], f"Incomplete text extraction: {book['id']}"
        ocr_count=0
        for n in range(1,book['pages']+1):
            raw=texts[n-1]
            row=dict(book=book['id'],page=n,text=clean(raw))
            if book['id']=='companion':
                ocr=REF/'companion-ocr'/f'page-{n:03}.txt'
                if ocr.exists():
                    row.update(text=clean(ocr.read_text(encoding='utf-8')),ocr=True);ocr_count+=1
                row['machineTranslated']=True
            pages.append(row);page_lookup[(book['id'],n)]=row
        if ocr_count:public['ocrPages']=ocr_count
        public_books.append(public)

    entries=[];seen=set()
    def add(name,category,book,page,text=None,**extra):
        name=clean(name)
        if not name or len(name)>160 or not (1<=page<=next(b['pages'] for b in BOOKS if b['id']==book)):return
        key=(norm(name),category,book,page)
        if key in seen:return
        seen.add(key)
        if text and '\n' in text:text=name+'\n'+text.split('\n',1)[1]
        row=dict(id=book+'-'+hashlib.sha1('|'.join(map(str,key)).encode()).hexdigest()[:14],name=name,category=category,book=book,page=page,text=text or page_lookup[(book,page)]['text'][:9000],reviewed=False)
        if page_lookup[(book,page)].get('ocr'):row['ocr']=True
        if book=='companion':row['machineTranslated']=True
        row.update(extra);entries.append(row)

    clan_options=[]
    for i,(name,label,page,affinities,weakness) in enumerate(CLANS):
        category='Clãs' if i<13 else 'Linhagens'
        opt=dict(name=name,label=label,disciplines=affinities,weakness=weakness,book='core',page=page,reviewed=True)
        if name in ['Children of Osiris','Kiasyd']:opt['chooseOriginalClanDisciplines']=2
        if name.startswith('Salubri'):opt['caste']=name[name.index('(')+1:-1]
        clan_options.append(opt)
        add(name,category,'core',page,label=label,disciplines=affinities,weakness=weakness,reviewed=True)
    road_options=[]
    for name,label,page,virtues in ROADS:
        opt=dict(name=name,label=label,virtues=virtues,book='core',page=page,reviewed=True)
        road_options.append(opt);add(name,'Caminhos','core',page,label=label,virtues=virtues,reviewed=True)
    discipline_options=[dict(name=n,label=l,book='core',page=p,reviewed=True) for n,l,p in DISCIPLINES]
    for opt in discipline_options:add(opt['name'],'Disciplinas','core',opt['page'],label=opt['label'],reviewed=True)

    background_options=[]; archetypes=[]; archetype_options=[]
    for book in ['core','secrets']:
        body,heads=read_layout(book)
        ritual_level=None;current='';ritual_context=False
        for h in heads:
            pn=h['page'];name=title(h['text']);raw=h['text']; txt=excerpt(body,h,heads)
            if book=='core':
                if 176<=pn<=180 and name in ARCHETYPE_LABELS:
                    archetypes.append(name);archetype_options.append(dict(name=name,label=ARCHETYPE_LABELS[name],book=book,page=pn))
                    add(name,'Arquétipos',book,pn,text=txt,label=ARCHETYPE_LABELS[name])
                if 180<=pn<=184 and name in BACKGROUND_LABELS:
                    opt=dict(name=name,label=BACKGROUND_LABELS[name],book=book,page=pn,reviewed=True)
                    background_options.append(opt);add(name,'Antecedentes',book,pn,text=txt,label=opt['label'],reviewed=True)
                if not 190<=pn<=320:continue
            elif not (32<=pn<=75 or 86<=pn<=91 or 102<=pn<=118):continue
            # Extract explicit costs rather than inferring them from rating dots.
            cost_match=re.search(r'\((\d+)\s*(?:pt\.?|point)\.?\s*(?:\w+\s+)?(Merit|Flaw)\)',name,re.I)
            if cost_match:
                cat='Qualidades' if cost_match[2].lower()=='merit' else 'Defeitos'
                add(name[:cost_match.start()].strip(),cat,book,pn,text=txt,cost=int(cost_match[1])*(1 if cat=='Qualidades' else -1),costReviewed=True)
                continue
            canonical=next((n for n,l,p in DISCIPLINES if norm(n).replace('(','').replace(')','')==norm(name).replace('(','').replace(')','')),None)
            if canonical:current=canonical;ritual_context=False;ritual_level=None
            if book=='core' and name in ['Quietus Cruscitus','Quietus Hematus']:current='Quietus ('+name.split()[1]+')'
            if book=='core' and name in ['Healer','Warrior','Watcher'] and 261<=pn<=268:current='Valeren ('+name+')'
            if re.match(r'Level (One|Two|Three|Four|Five|Six|Seven|Eight|Nine)( Rituals?)?$',name):
                ritual_level=WORD_LEVELS[name.split()[1]];ritual_context=True;continue
            if any(k in norm(name) for k in ['rituals','rites of the kraina']):ritual_context=True
            if any(k in norm(name) for k in ['the path of','kraina','revelations of','keepers way','tyranny of the wyrm','rego calatio','grave’s decay','vitreous path','creatio ignis','iter pernix','potestas ']):
                if h['size']>=21 and not any(k in norm(name) for k in ['rivalry','rites of','secret','many-headed']):
                    current=name;add(name,'Trilhas de feitiçaria',book,pn,text=txt);ritual_context=False
            bullets=raw.count('•')
            if 1<=bullets<=9:
                pname=title(re.sub(r'[•()]+',' ',raw))
                if len(pname)<3 or re.match(r'^(Outstanding|Uncaring|Normal|Level|Spineless)',pname):continue
                isritual=ritual_context or (book=='core' and 272<=pn<=275) or (book=='secrets' and 36<=pn<=39)
                add(pname,'Rituais' if isritual else 'Poderes',book,pn,text=txt,rating=bullets,parent=current)
            elif book=='core' and 293<=pn<=297 and h['size']==18:
                add(name,'Rituais',book,pn,text=txt,rating=ritual_level or 1,parent='Necromancy')
            elif book=='core' and 304<=pn<=312 and h['size']==18:
                lm=re.match(r'^Level (One|Two|Three|Four|Five|Six|Seven|Eight|Nine):\s*(.*)',name)
                level=ritual_level or 1
                if lm:
                    level=WORD_LEVELS[lm[1]];name=lm[2]
                    if not name:continue
                add(name,'Rituais',book,pn,text=txt,rating=level,parent='Thaumaturgy')
            elif book=='core' and 314<=pn<=320 and h['size']==21 and not raw.isupper() and name not in ['Combination Disciplines']:
                xp=re.search(r'Experience Cost:\s*(\d+)',txt)
                add(name,'Disciplinas combinadas',book,pn,text=txt,**({'xpCost':int(xp[1])} if xp else {}))
            elif book=='secrets' and ((43<=pn<=44 and re.search(r'\(Level \d\)',name)) or (49<=pn<=53 and h['size']==21)):
                level=re.search(r'Level (\d)',name)
                word_level=re.search(r'Level (One|Two|Three|Four|Five|Six|Seven|Eight|Nine) Rite',txt,re.I)
                add(re.sub(r'\s*\(Level \d\)','',name),'Rituais',book,pn,text=txt,rating=int(level[1]) if level else WORD_LEVELS[word_level[1].title()] if word_level else 1)
            elif book=='secrets' and (pn==107 or 116<=pn<=117) and h['size']==21:
                if name in ['Combination Disciplines','Abyss Mysticism'] or re.search(r'\(Level \d\)',name):continue
                xp=re.search(r'(?:Experience Cost:\s*|Cost:\s*)(\d+)',txt)
                if xp:add(name,'Disciplinas combinadas',book,pn,text=txt,xpCost=int(xp[1]))
            elif book=='secrets' and pn==118 and h['size']==21:
                level=re.search(r'Level (\d)',name)
                if level:add(re.sub(r'\s*\(Level \d\)','',name),'Rituais',book,pn,text=txt,rating=int(level[1]))
            if book=='secrets' and name.startswith('New Background:'):
                bn=name.split(':',1)[1].strip();label=BACKGROUND_LABELS.get(bn,bn)
                opt=dict(name=bn,label=label,book=book,page=pn,reviewed=True);background_options.append(opt)
                add(bn,'Antecedentes',book,pn,text=txt,label=label,reviewed=True)

        if book=='core':
            merit_category=None
            for n,line in enumerate(body):
                if not 421<=line['page']<=428:continue
                s=line['text']
                if re.search(r'(Physical|Mental|Social|Supernatural) Merits$',title(s)):merit_category='Qualidades'
                if re.search(r'(Physical|Mental|Social|Supernatural) Flaws$',title(s)):merit_category='Defeitos'
                m=re.match(r'^(.{3,85}?)\s*\((\d(?:\s*(?:or|to|,|–|-)\s*\d)?)\s+points?\):',s,re.I)
                if not m:continue
                choices=list(map(int,re.findall(r'\d',m[2])))
                if re.search(r'\bto\b|–|-',m[2]) and len(choices)==2:choices=list(range(choices[0],choices[1]+1))
                sign=-1 if merit_category=='Defeitos' else 1
                values=sorted(set(sign*x for x in choices),key=abs); cat=merit_category or 'Qualidades'
                end=next((j for j in range(n+1,min(len(body),n+100)) if re.match(r'^.{3,85}?\s*\(\d.*?points?\):',body[j]['text'],re.I)),min(len(body),n+60))
                text=clean('\n'.join(x['text'] for x in body[n:end]))[:9000]
                add(m[1],cat,book,line['page'],text=text,cost=values[0],costs=values,costChoices=values,costLabel=m[2].replace('or','ou').replace('to','a')+' '+('ponto' if len(choices)==1 and choices[0]==1 else 'pontos'),costReviewed=True)

    # Companion's printed folio is PDF index minus one. These names are checked
    # against its TOC; full page text remains searchable and marked OCR as needed.
    companion_sections=[
      ('Caminho dos Puros (Katharoi)','Caminhos',21),('Ancestral Nobre','Regras',41),
      ('O Espelho Rachado','Poderes',55),('Kallikantzaros','Cenário',67),
      ('Caminho do Arcanjo','Caminhos',71),('A Estrada de Zaratustra','Caminhos',84),
      ('A Estrada de Angra Mainyu','Caminhos',85),('A Estrada de Ahura Mazda','Caminhos',85),
      ('Rituais Zoroastrianos','Rituais',85),('O poder das trevas (Ramanga)','Poderes',87),
      ('Pishacha','Cenário',98),('O Sangue de Samiel','Regras',100),
      ('Jati','Regras',102),('Phuri Dae','Linhagens',102),
      ('O Domínio de Roma','Cenário',10),('O Domínio de Bath','Cenário',26),
      ('O Domínio de Bjarkarey','Cenário',44),('O Domínio de Constantinopla','Cenário',58),
      ('O Domínio de Mogadíscio','Cenário',76),('O Domínio de Mangaluru','Cenário',92),
      ('Construindo um Domínio','Cenário',106),
    ]
    for name,category,pn in companion_sections:add(name,category,'companion',pn)
    additional=[
      ('Demonic Patron','Qualidades','secrets',109,dict(cost=5,costs=[5],costReviewed=True)),
      ('Vassal','Qualidades','secrets',80,dict(cost=1,costs=[1,2,3,4,5],costLabel='1 a 5 pontos; especial',costReviewed=True)),
      ('Boukephos’ Chosen Oubliette','Rituais','secrets',39,dict(rating=9,parent='Abyss Mysticism')),
      ('The Third Eye of Rickard Argentis','Rituais','secrets',117,dict(rating=3,parent='Abyss Mysticism')),
      ('Livia Yorke’s Ouroboros','Disciplinas combinadas','secrets',116,dict()),
      ('Road of Blood','Caminhos','core',433,dict()),('Road of the Abyss','Caminhos','core',442,dict()),
      ('Road of Paradox','Caminhos','core',446,dict()),('Road of Set','Caminhos','core',449,dict()),
      ('Marca do Rastreador','Qualidades','companion',101,dict(cost=2,costs=[2],costReviewed=True)),
      ('Sangue pelo Código','Qualidades','companion',101,dict(cost=5,costs=[5],costReviewed=True)),
      ('Ravnos Jati','Qualidades','companion',102,dict(cost=2,costs=[2],costReviewed=True)),
      ('Assentamento','Qualidades','companion',110,dict(cost=1,costs=[1,2,3,4,5],costLabel='1 a 5 pontos',costReviewed=True)),
      ('Feudos e vassalagem','Regras','companion',107,dict()),
      ('Servos','Antecedentes','companion',113,dict()),
      ('O poder do néctar de sangue','Trilhas de feitiçaria','companion',103,dict(parent='Sadhana')),
      ('O poder do carma','Trilhas de feitiçaria','companion',104,dict(parent='Sadhana')),
      ('Dome a Chama Enlouquecedora','Rituais','companion',117,dict(rating=1,parent='Thaumaturgy')),
      ('Rituais de proibição','Rituais','companion',117,dict(rating=2,parent='Thaumaturgy',ratingNote='Nível 2 ou superior; cada categoria é aprendida separadamente.')),
      ('Empunhe a lança da condenação','Rituais','companion',117,dict(rating=3,parent='Thaumaturgy')),
      ('Muralhas da Ravena de Ceoris','Rituais','companion',118,dict(rating=5,parent='Thaumaturgy')),
      ('Combate simplificado','Regras','companion',129,dict()),
    ]
    for name,category,book,pn,extra in additional:add(name,category,book,pn,**extra)
    background_options.append(dict(name='Servants',label='Servos',book='companion',page=113,reviewed=True))
    for entry in entries:
        entry['category']=CATEGORY_KEYS[entry['category']]
        if 'cost' in entry and 'costs' not in entry:entry['costs']=[entry['cost']]
        if 'cost' in entry and 'costLabel' not in entry:entry['costLabel']=str(abs(entry['cost']))+' '+('ponto' if abs(entry['cost'])==1 else 'pontos')
    entries.sort(key=lambda e:(e['book'],e['page'],e['category'],e['name']))
    stats=collections.Counter(e['category'] for e in entries)
    corpus=dict(books=public_books,pages=pages,entries=entries,pageCount=len(pages),entryCount=len(entries),categories=sorted(stats),schemaVersion=1)
    options=dict(clans=clan_options,roads=road_options,disciplines=discipline_options,backgrounds=background_options,archetypes=archetypes,archetypeOptions=archetype_options,labels=dict(virtues={'Conscience':'Consciência','Conviction':'Convicção','Self-Control':'Autocontrole','Instinct':'Instinto','Courage':'Coragem'}),pageIndex='PDF one-based',reviewScope='Afinidades, Virtudes, referências, rótulos e resumos de fraquezas revisados; trechos do catálogo extraídos das fontes e não integralmente revisados.')
    write=lambda file,value:(DATA/file).write_text(json.dumps(value,ensure_ascii=False,separators=(',',':')), encoding='utf-8')
    write('catalog.json',corpus)
    (DATA/'catalog.js').write_text('self.VTM_CORPUS='+json.dumps(corpus,ensure_ascii=False,separators=(',',':'))+';\n', encoding='utf-8')
    metadata={k:corpus[k] for k in ['books','pageCount','entryCount','categories','schemaVersion']}
    metadata['libraryReady']=True
    write('library-local.json',metadata)
    # Reviewed interface choices stay in source control; generated book text stays local.
    report=dict(pages=len(pages),entries=len(entries),categories=dict(stats),books={b['id']:dict(pages=b['pages'],entries=sum(e['book']==b['id'] for e in entries),ocrPages=b.get('ocrPages',0)) for b in public_books})
    write('coverage.json',report)
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':build()
