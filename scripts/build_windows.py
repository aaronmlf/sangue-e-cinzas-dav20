"""Build the portable DAV20 Windows application using the verified Electron runtime."""
import hashlib, json, pathlib, shutil, zipfile
PROJECT=pathlib.Path(__file__).resolve().parents[1]
WORKSPACE=PROJECT
RUNTIME=WORKSPACE/'tmp/electron-win32-x64.zip'
EXPECTED='97dcb75065444ef031b9b6ea814ccd2109b97934fffb0c503a555d4737ca79cc'
if not RUNTIME.is_file() or hashlib.file_digest(RUNTIME.open('rb'),'sha256').hexdigest()!=EXPECTED:
    raise SystemExit('Runtime Electron 43.7.7 Windows x64 ausente ou com SHA-256 diferente do release oficial.')
VERSION=json.loads((PROJECT/'app/package.json').read_text(encoding='utf-8'))['version']
NAME=f'Sangue-e-Cinzas-{VERSION}-Windows-x64'
TARGET=WORKSPACE/'dist'/NAME
if (TARGET/'dados').exists() and any((TARGET/'dados').iterdir()):
    raise SystemExit('A pasta de distribuição contém dados: preserve as fichas antes de recompilar.')
TARGET.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(RUNTIME) as archive:
    archive.extractall(TARGET)
(TARGET/'electron.exe').replace(TARGET/'Sangue-e-Cinzas.exe')
(TARGET/'resources/default_app.asar').unlink(missing_ok=True)
app_dest=TARGET/'resources/app'
if app_dest.exists(): shutil.rmtree(app_dest)
shutil.copytree(PROJECT/'app',app_dest)
from build_dependencies import install_production_dependencies
install_production_dependencies(PROJECT,app_dest)
for source in ['LEIA-ME.txt','REGRAS.md','CATALOGO.md','VALIDACAO.md','VALIDACAO-REPOSITORIO.md']:
    shutil.copy2(PROJECT/source,TARGET/source)
(TARGET/'dados').mkdir(exist_ok=True)
assert not any((TARGET/'dados').iterdir())
zipout=WORKSPACE/'dist'/f'{NAME}.zip'
with zipfile.ZipFile(zipout,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    archive.writestr(NAME+'/dados/','')
    for file in sorted(TARGET.rglob('*')):
        if file.is_file(): archive.write(file,pathlib.Path(NAME)/file.relative_to(TARGET))
with zipfile.ZipFile(zipout) as archive:
    if archive.testzip(): raise SystemExit('Falha na integridade do ZIP.')
    names=archive.namelist()
    assert f'{NAME}/Sangue-e-Cinzas.exe' in names
    assert not any('/dados/' in p and not p.endswith('/') for p in names)
sha=hashlib.file_digest(zipout.open('rb'),'sha256').hexdigest()
checksum=WORKSPACE/'dist'/f'{NAME}.sha256.txt'
checksum.write_text(f'{sha}  {zipout.name}\n', encoding='utf-8')
print(f'Pacote: {zipout}\nTamanho: {zipout.stat().st_size/1024**2:.1f} MiB\nSHA-256: {sha}')
