"""Build and verify the portable Linux x64 DAV20 distribution."""
import argparse
import hashlib
import json
import pathlib
import shutil
import stat
import tarfile
import tempfile
import zipfile

PROJECT = pathlib.Path(__file__).resolve().parents[1]
WORKSPACE = PROJECT
RUNTIME_VERSION = "43.7.7"
# Electron's official v43.7.7 SHASUMS256.txt, linux-x64 archive.
EXPECTED = "4d0a48398c444258dbcf2f5f83b49ca5bc53583130f354e0c299dad5b22b5271"


def digest(file):
    with file.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def fail(message):
    raise SystemExit(message)


def existing_target_is_safe(target, name):
    if target.is_symlink():
        fail("A pasta de distribuição é um atalho: escolha uma pasta real.")
    if not target.exists():
        return
    data = target / "dados"
    if data.is_symlink() or (data.exists() and (not data.is_dir() or any(data.iterdir()))):
        fail("A distribuição contém dados: preserve as fichas antes de recompilar.")
    marker = target / ".distribution.json"
    try:
        previous = json.loads(marker.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        fail("A pasta de destino já existe e não foi criada por este empacotador.")
    if previous.get("name") != name or previous.get("format") != "sangue-e-cinzas-linux-portable":
        fail("A pasta de destino não corresponde a esta distribuição.")


def extract_runtime(archive_path, target):
    with zipfile.ZipFile(archive_path) as archive:
        for entry in archive.infolist():
            relative = pathlib.PurePosixPath(entry.filename)
            if relative.is_absolute() or ".." in relative.parts or "\\" in entry.filename:
                fail("Caminho inválido no runtime.")
            mode = (entry.external_attr >> 16) & 0xFFFF
            if stat.S_ISLNK(mode):
                fail("Atalho inesperado no runtime.")
        bad = archive.testzip()
        if bad:
            fail(f"O runtime contém arquivo corrompido: {bad}")
        archive.extractall(target)
        for entry in archive.infolist():
            file = target / entry.filename
            if file.is_file():
                mode = (entry.external_attr >> 16) & 0o777
                file.chmod(0o755 if mode & 0o111 else 0o644)
    if (target / "version").read_text(encoding='utf-8').strip() != RUNTIME_VERSION:
        fail("Versão do runtime diferente da versão verificada.")
    (target / "electron").rename(target / "sangue-e-cinzas")
    (target / "sangue-e-cinzas").chmod(0o755)
    (target / "chrome-sandbox").chmod(0o755)
    (target / "chrome_crashpad_handler").chmod(0o755)
    (target / "resources/default_app.asar").unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--runtime", type=pathlib.Path, default=WORKSPACE / "tmp/electron-linux-x64.zip")
    args = parser.parse_args()
    if not args.runtime.is_file() or digest(args.runtime) != EXPECTED:
        fail("Runtime Electron 43.7.7 Linux x64 ausente ou com SHA-256 diferente do release oficial.")
    version = json.loads((PROJECT / "app/package.json").read_text(encoding='utf-8'))["version"]
    name = f"Sangue-e-Cinzas-{version}-Linux-x64"
    destination = WORKSPACE / "dist"
    destination.mkdir(exist_ok=True)
    target = destination / name
    existing_target_is_safe(target, name)
    with tempfile.TemporaryDirectory(prefix=".sangue-linux-build-", dir=destination) as temporary:
        staged = pathlib.Path(temporary) / name
        staged.mkdir()
        extract_runtime(args.runtime, staged)
        app_source = PROJECT / "app"
        if any(file.is_symlink() for file in app_source.rglob("*")):
            fail("O aplicativo contém atalhos: o pacote deve incluir arquivos completos.")
        shutil.copytree(app_source, staged / "resources/app")
        from build_dependencies import install_production_dependencies
        install_production_dependencies(PROJECT, staged / "resources/app")
        shutil.copy2(PROJECT / "LEIA-ME-LINUX.txt", staged / "LEIA-ME.txt")
        shutil.copy2(PROJECT / "LEIA-ME.txt", staged / "LEIA-ME-WINDOWS.txt")
        for filename in ["LEIA-ME-LINUX.txt", "README.md", "REGRAS.md", "CATALOGO.md", "VALIDACAO.md", "VALIDACAO-LINUX.md", "VALIDACAO-REPOSITORIO.md"]:
            shutil.copy2(PROJECT / filename, staged / filename)
        # The common README links both editions; keep the Linux default readme intuitive.
        readme = staged / "README.md"
        readme.write_text(readme.read_text(encoding='utf-8').replace(
            "[LEIA-ME.txt](LEIA-ME.txt) para Windows",
            "[LEIA-ME-WINDOWS.txt](LEIA-ME-WINDOWS.txt) para Windows",
        ), encoding='utf-8')
        for file in (PROJECT / "linux").iterdir():
            if not file.is_file() or file.is_symlink():
                fail("Arquivo inválido na pasta de lançadores Linux.")
            shutil.copy2(file, staged / file.name)
        (staged / "dados").mkdir()
        (staged / ".distribution.json").write_text(json.dumps({
            "format": "sangue-e-cinzas-linux-portable", "name": name, "version": version,
            "runtime": f"Electron {RUNTIME_VERSION} Linux x64", "runtimeSHA256": EXPECTED,
        }, ensure_ascii=False, indent=2) + "\n", encoding='utf-8')
        for file in staged.rglob("*"):
            if file.is_dir():
                file.chmod(0o755)
            elif file.is_file():
                executable = file.name in {"sangue-e-cinzas", "chrome-sandbox", "chrome_crashpad_handler"} or file.suffix == ".sh"
                file.chmod(0o755 if executable else 0o644)
        expected_files = {
            str(pathlib.PurePosixPath(name) / file.relative_to(staged).as_posix()): digest(file)
            for file in staged.rglob("*") if file.is_file()
        }
        archive_path = destination / f"{name}.tar.gz"
        temporary_archive = pathlib.Path(temporary) / archive_path.name

        def portable_metadata(entry):
            entry.uid = entry.gid = 0
            entry.uname = entry.gname = "root"
            entry.mode &= 0o777
            return entry

        with tarfile.open(temporary_archive, "w:gz", compresslevel=6, format=tarfile.PAX_FORMAT) as archive:
            archive.add(staged, arcname=name, filter=portable_metadata)
        with tarfile.open(temporary_archive, "r:gz") as archive:
            actual_files = {}
            for entry in archive.getmembers():
                if entry.issym() or entry.islnk() or entry.mode & 0o7000:
                    fail("O pacote contém atalho ou permissão especial inesperada.")
                relative = pathlib.PurePosixPath(entry.name)
                if relative.is_absolute() or ".." in relative.parts:
                    fail("Caminho inválido no pacote.")
                if entry.isfile():
                    if "dados" in relative.parts[1:2]:
                        fail("O pacote contém dados de usuário.")
                    with archive.extractfile(entry) as stream:
                        actual_files[entry.name] = hashlib.file_digest(stream, "sha256").hexdigest()
                if entry.name.endswith("/Iniciar-Sangue-e-Cinzas.sh") or entry.name.endswith("/sangue-e-cinzas"):
                    if entry.mode != 0o755:
                        fail("O programa ou lançador não tem permissão de execução.")
            if actual_files != expected_files:
                fail("O conteúdo do pacote difere dos arquivos de origem.")
        # A user may have opened the previous distribution while this build ran.
        existing_target_is_safe(target, name)
        if target.exists():
            shutil.rmtree(target)
        staged.replace(target)
        temporary_archive.replace(archive_path)
    checksum = digest(archive_path)
    (destination / f"{name}.sha256.txt").write_text(f"{checksum}  {archive_path.name}\n", encoding='utf-8')
    print(f"Pacote: {archive_path}\nTamanho: {archive_path.stat().st_size / 1024**2:.1f} MiB\nSHA-256: {checksum}")


if __name__ == "__main__":
    main()
