#!/usr/bin/env python3
"""Download a fixed official Electron archive and verify its known SHA-256."""
import argparse
import hashlib
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
RUNTIMES = {
    'windows': ('win32-x64', 'electron-win32-x64.zip', '97dcb75065444ef031b9b6ea814ccd2109b97934fffb0c503a555d4737ca79cc'),
    'linux': ('linux-x64', 'electron-linux-x64.zip', '4d0a48398c444258dbcf2f5f83b49ca5bc53583130f354e0c299dad5b22b5271'),
}


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('platform', choices=RUNTIMES)
    args = parser.parse_args()
    platform, filename, expected = RUNTIMES[args.platform]
    target = ROOT / 'tmp' / filename
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and digest(target) == expected:
        print('Runtime já verificado:', target)
        return
    temporary = target.with_suffix('.zip.partial')
    url = f'https://github.com/electron/electron/releases/download/v43.7.7/electron-v43.7.7-{platform}.zip'
    try:
        with urllib.request.urlopen(url, timeout=120) as source, temporary.open('wb') as out:
            while block := source.read(1024 * 1024):
                out.write(block)
        if digest(temporary) != expected:
            raise SystemExit('SHA-256 diferente do release oficial. O arquivo não será usado.')
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    print('Runtime oficial verificado:', target)


if __name__ == '__main__':
    main()
