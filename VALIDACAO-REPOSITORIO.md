# Validação do repositório público

A preparação pública mantém os PDFs, extrações, OCR, catálogos integrais, fichas, perfis e distribuições fora do Git. A aplicação inicia sem esses arquivos e explica como configurar uma biblioteca pessoal. As distribuições pessoais anteriores não foram alteradas.

## Dependências e runtime

- Electron **43.7.7**, Playwright **1.58.2** e pdf-lib **1.17.1** fixados no `package.json` e `package-lock.json`.
- Node.js **22.12.0 ou posterior** para desenvolvimento.
- A auditoria npm realizada na preparação retornou **0 vulnerabilidades**. Esse resultado é uma observação na data da verificação; novos avisos podem surgir.
- Electron Windows x64 e Linux x64 foram baixados do [release oficial 43.7.7](https://github.com/electron/electron/releases/tag/v43.7.7) e comparados com seu `SHASUMS256.txt`. Os hashes estão fixados nos scripts de download e empacotamento.
- Windows: `97dcb75065444ef031b9b6ea814ccd2109b97934fffb0c503a555d4737ca79cc`.
- Linux: `4d0a48398c444258dbcf2f5f83b49ca5bc53583130f354e0c299dad5b22b5271`.

A atualização substitui a dependência histórica Electron 40.4.0. Entre os avisos revisados estão [GHSA-gr2m-v5gq-v685](https://github.com/advisories/GHSA-gr2m-v5gq-v685), [GHSA-j84w-jfhq-vhvj](https://github.com/advisories/GHSA-j84w-jfhq-vhvj) e [GHSA-9qh4-3jw8-366w](https://github.com/advisories/GHSA-9qh4-3jw8-366w). A versão escolhida também mantém uma linha com suporte, conforme o [calendário oficial](https://releases.electronjs.org/schedule).

## Verificações executadas

- 36 testes de regras, 5 de impressão e 3 da inicialização sem livros: todos passaram.
- As 12 telas abriram com Electron 43.7.7 no checkout sem acervo, sem exceções e sem rolagem horizontal em 960 × 720.
- Importação da instalação pessoal: PDFs conferidos por SHA-256 e índice privado reaproveitado.
- Regeneração a partir dos PDFs e de um cache OCR privado: reproduziu 732 páginas, 770 referências e 99 páginas OCR. O teste ocorreu fora da árvore de arquivos publicada.
- 18 fluxos de uso passaram com Electron 43.7.7 e uma cópia privada de teste: criação, clã/Caminho, bônus, XP, equipamentos, vitalidade, dados, modificador +20.000, compartilhamento, pesquisa, fontes, ambos os PDFs e histórico após reabrir.
- 2 testes do formulário oficial passaram: os 992 campos interativos, widgets, valores, acentos, aparências e estados de vitalidade foram preservados.
- A exportação completa desse personagem de teste gerou 5 páginas A4, devido ao diário extenso; a oficial manteve 4 páginas. Todas foram renderizadas e inspecionadas, sem páginas apenas com rodapé ou cortes de conteúdo.

Os testes de interface e exportação desta preparação foram realizados em Linux. Os relatórios `VALIDACAO.md` e `VALIDACAO-LINUX.md` descrevem os testes históricos das distribuições pessoais originais, com seu runtime anterior. Não representam uma nova certificação de executável Windows sob Electron 43.7.7.

## Reproduzir

`npm ci` seguido de `npm test` verifica o checkout público sem livros. `npm run test:ui` abre as 12 telas usando o Electron instalado pelo npm. `ELECTRON_PATH` aceita outro runtime local e `APP_PATH` uma cópia privada de aplicativo para testes de interface ou formulário. Os demais testes que consultam fontes precisam de biblioteca configurada, conforme o README. Os arquivos de teste e suas saídas ficam em `tmp/`, ignorada pelo Git.
