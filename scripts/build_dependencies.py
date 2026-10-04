"""Copy only installed production dependencies, including their licenses."""
import json
import pathlib
import shutil


def install_production_dependencies(project, destination):
    modules = destination / 'node_modules'
    # Never put Electron, Playwright or a developer's entire dependency tree in a release.
    if modules.exists():
        shutil.rmtree(modules)
    dependencies = json.loads((project / 'package.json').read_text(encoding='utf-8')).get('dependencies', {})
    pending = list(dependencies)
    seen = set()
    while pending:
        name = pending.pop()
        if name in seen:
            continue
        seen.add(name)
        source = project / 'node_modules' / name
        if not (source / 'package.json').is_file():
            raise SystemExit('Dependência de produção ausente: ' + name + '. Execute npm install primeiro.')
        metadata = json.loads((source / 'package.json').read_text(encoding='utf-8'))
        if name in dependencies and metadata['version'] != dependencies[name]:
            raise SystemExit('Versão da dependência diferente do package.json: ' + name)
        shutil.copytree(source, modules / name)
        pending.extend(metadata.get('dependencies', {}))
