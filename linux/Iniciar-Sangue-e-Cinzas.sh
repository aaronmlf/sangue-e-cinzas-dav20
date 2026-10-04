#!/bin/sh
# Keep paths and arguments intact, including directory names with spaces.
set -eu
APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
if [ "$(uname -m)" != "x86_64" ]; then
    printf '%s\n' 'Esta edição requer Linux x64 (processador Intel ou AMD de 64 bits).' >&2
    exit 1
fi
if [ ! -x "$APP_DIR/sangue-e-cinzas" ]; then
    printf '%s\n' 'O programa não pode ser executado nesta pasta. Extraia todo o pacote em uma pasta pessoal de um disco Linux com permissão de execução.' >&2
    exit 1
fi
exec "$APP_DIR/sangue-e-cinzas" "$@"
