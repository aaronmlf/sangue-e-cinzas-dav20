#!/usr/bin/env python3
"""Initialize a private local library from the user's own PDFs or existing app."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BOOKS = {
    'core': ('core.pdf', '(VtDA 20) Vampire the Dark Ages 20AE.pdf', '5289f30e086d03e7590de7a7450d58bcc1775a611e8ef4fad4471fd14f6354a0'),
    'companion': ('companion.pdf', 'ilide.info-vtda-20th-companion-traduzido-pr_af75b86126bde0a0daf24e1c420523be.pdf', 'bf4dcbd91bea9943d2454da5928818e5bb8a13f0b5c18b28811558547cc96d75'),
    'secrets': ('secrets.pdf', 'ilide.info-v20-dark-ages-tome-of-secrets-pdf-pr_f44e9bc4424601a27afaa8c65b0129e7.pdf', '6f7528d7264807d8a323d58eabeef6a902370831e2f0a16a0aed1625fdc28989'),
    'sheet': ('ficha-oficial.pdf', 'DAV20_4-Page_Official_Interactive.pdf', 'c7e9aa6d7e6dee5ee05d068d776b3905622733123e4da406853df2f2a0952f7b'),
}
OCR_PAGES = [6, *range(36, 134)]


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def run(command):
    subprocess.run([str(part) for part in command], check=True, stdout=subprocess.DEVNULL)


def metadata(corpus):
    books = corpus.get('books', [])
    if {b.get('id') for b in books} != set(BOOKS):
        raise SystemExit('O catálogo local não corresponde aos quatro livros esperados.')
    if len(corpus.get('pages', [])) != 732 or not isinstance(corpus.get('entries'), list):
        raise SystemExit('O catálogo da instalação está incompleto.')
    return {'books': books, 'pageCount': len(corpus['pages']), 'entryCount': len(corpus['entries']),
            'categories': sorted({entry['category'] for entry in corpus['entries']}),
            'schemaVersion': 1, 'libraryReady': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, help='Pasta dos PDFs ou resources/app de sua instalação local.')
    parser.add_argument('--ocr-cache', type=Path, help='Cache privado companion-ocr com page-NNN.txt.')
    parser.add_argument('--ocr', action='store_true', help='Gerar OCR offline das 99 páginas do Companion.')
    parser.add_argument('--tessdata', type=Path, help='Pasta dos modelos locais por.traineddata e eng.traineddata.')
    args = parser.parse_args()
    if not args.source.is_dir():
        parser.error('A pasta de origem não existe.')
    files = list(args.source.rglob('*.pdf'))
    sources = {}
    for book, (filename, original, expected) in BOOKS.items():
        candidates = [p for p in files if p.name in (filename, original)]
        match = next((p for p in candidates if digest(p) == expected), None)
        if not match:
            raise SystemExit('PDF ausente ou edição diferente: ' + original + '. Use os mesmos PDFs indicados em CATALOGO.md.')
        sources[book] = match
    data = ROOT / 'app/data'
    # An existing personal installation already has its privately generated index.
    existing = args.source / 'data/catalog.json'
    corpus = json.loads(existing.read_text(encoding='utf-8')) if existing.is_file() else None
    if corpus is not None:
        local_metadata = metadata(corpus)
    else:
        required = ['pdftotext', 'pdftohtml']
        if args.ocr:
            required.extend(['pdftoppm', 'tesseract'])
        for command in required:
            if not shutil.which(command):
                raise SystemExit('Ferramenta local ausente: ' + command + '. Veja os pré-requisitos no README.')
        if args.ocr_cache and any(not (args.ocr_cache / f'page-{n:03}.txt').is_file() for n in OCR_PAGES):
            raise SystemExit('O cache OCR deve conter as 99 páginas indicadas em CATALOGO.md.')
    books_dir = ROOT / 'app/livros'
    books_dir.mkdir(exist_ok=True)
    for book, source in sources.items():
        target = books_dir / BOOKS[book][0]
        if source.resolve() != target.resolve():
            shutil.copy2(source, target)
    if corpus is not None:
        serialized = json.dumps(corpus, ensure_ascii=False, separators=(',', ':'))
        (data / 'catalog.json').write_text(serialized, encoding='utf-8')
        (data / 'catalog.js').write_text('self.VTM_CORPUS=' + serialized + ';\n', encoding='utf-8')
        (data / 'library-local.json').write_text(json.dumps(local_metadata, ensure_ascii=False), encoding='utf-8')
        print('Acervo privado importado da sua instalação:', local_metadata['entryCount'], 'referências.')
        return
    refs = ROOT / 'referencias'
    refs.mkdir(exist_ok=True)
    for book, (filename, _, _) in BOOKS.items():
        source = books_dir / filename
        run(['pdftotext', '-layout', source, refs / f'{book}.txt'])
        if book != 'sheet':
            run(['pdftohtml', '-xml', '-hidden', '-i', '-q', source, refs / f'{book}-layout.xml'])
    ocr_dir = refs / 'companion-ocr'
    if args.ocr_cache:
        ocr_dir.mkdir(exist_ok=True)
        for n in OCR_PAGES:
            shutil.copy2(args.ocr_cache / f'page-{n:03}.txt', ocr_dir / f'page-{n:03}.txt')
    elif args.ocr:
        ocr_dir.mkdir(exist_ok=True)
        temporary = ROOT / 'tmp/library-ocr'
        temporary.mkdir(parents=True, exist_ok=True)
        for n in OCR_PAGES:
            stem = temporary / 'page'
            run(['pdftoppm', '-f', n, '-singlefile', '-r', 150, '-png', books_dir / 'companion.pdf', stem])
            command = ['tesseract', str(stem) + '.png', 'stdout', '-l', 'por+eng']
            if args.tessdata:
                command.extend(['--tessdata-dir', args.tessdata])
            with (ocr_dir / f'page-{n:03}.txt').open('w', encoding='utf-8') as output:
                subprocess.run([str(part) for part in command], check=True, stdout=output)
            (temporary / 'page.png').unlink(missing_ok=True)
            print(f'OCR local: página {n}/133')
    elif not all((ocr_dir / f'page-{n:03}.txt').exists() for n in OCR_PAGES):
        print('Aviso: sem OCR, páginas em imagem do Companion não terão texto pesquisável.', file=sys.stderr)
    subprocess.run([sys.executable, ROOT / 'scripts/build_catalog.py'], check=True)
    print('Acervo local pronto. Feche e reabra o aplicativo. Livros e índices permanecem ignorados pelo Git.')


if __name__ == '__main__':
    main()
