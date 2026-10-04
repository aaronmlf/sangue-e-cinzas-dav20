# Sangue & Cinzas — Dark Ages V20

Criador de fichas offline em português para **Vampiro: Idade das Trevas, edição de 20 anos**. Aplicativo Electron para Windows e Linux x64, com criação, evolução por experiência, recursos de mesa, equipamentos, modificadores altos e compartilhamento de personagens em `.dav20.json`.

Este repositório público contém o código e as escolhas resumidas da interface. **Os PDFs, o texto integral dos livros e os índices gerados não são publicados.** O criador e a exportação do PDF completo funcionam sem acervo. A pesquisa nos livros e o preenchimento da ficha oficial ficam disponíveis após configurar seus próprios arquivos locais.

## Executar o código

Instale Node.js 22.12 ou posterior e npm. Na pasta do projeto:

```sh
npm ci
npm start
```

O Electron de desenvolvimento é instalado pelo npm. Em Linux, uma sessão gráfica e as bibliotecas de sistema do Electron são necessárias. Não execute o aplicativo como root.

```sh
npm test
npm run test:ui
```

A primeira tarefa verifica regras, impressão e a inicialização sem livros. O teste de interface usa o Electron e o Playwright instalados pelo npm; em um servidor Linux sem tela, use `xvfb-run -a npm run test:ui`. `ELECTRON_PATH` e `PLAYWRIGHT_PATH` permitem indicar instalações próprias. Os testes de fluxos completos, desempenho, pacote Linux, Windows/Wine e ficha oficial também estão em `tests/`; os que consultam livros exigem o acervo configurado.

## Preparar a biblioteca local

Instale Python 3.11 ou posterior para a importação. Se você já possui uma instalação pessoal completa do aplicativo, indique a sua pasta **resources/app**:

```sh
npm run library:import -- "/caminho/Sangue-e-Cinzas/resources/app"
```

O importador verifica os quatro PDFs por SHA-256 e reaproveita seu índice pessoal. Nenhum arquivo é enviado à internet.

Também é possível importar diretamente uma pasta com os PDFs listados em [CATALOGO.md](CATALOGO.md). Instale Python 3.11 ou posterior e Poppler, com `pdftotext` e `pdftohtml` disponíveis no PATH:

```sh
npm run library:import -- "/pasta/dos/pdfs"
```

O Companion usado como referência tem 99 páginas em imagem. Para pesquisá-las, instale Tesseract com modelos **por** e **eng** e execute:

```sh
npm run library:import -- "/pasta/dos/pdfs" --ocr
```

Um cache pessoal existente pode ser passado com `--ocr-cache "/pasta/companion-ocr"`; `--tessdata` aceita a pasta de modelos locais. Sem OCR ou cache, o texto já existente é indexado e o importador avisa sobre as páginas em imagem. OCR roda somente nessa preparação, nunca ao abrir o aplicativo. Feche e reabra o programa após importar. O formato de importação exige as mesmas edições e arquivos descritos no catálogo para manter páginas e referências corretas.

Os PDFs vão para `app/livros`, as extrações para `referencias` e os índices privados para `app/data/catalog.*` e `library-local.json`. Todos esses arquivos são ignorados pelo Git. A configuração pode ser refeita localmente sem alterar as escolhas revisadas da interface.

Com seu PDF oficial configurado e `npm install` concluído:

```sh
npm run test:official
```

## Gerar as edições portáteis

Instale Python 3.11 ou posterior. Após `npm install`, baixe o runtime oficial fixado em **Electron 43.7.7**; o script confere o SHA-256 conhecido antes de usá-lo:

```sh
npm run runtime:windows
npm run build:windows
npm run runtime:linux
npm run build:linux
```

Os arquivos são gerados em `dist/`, com dependências de produção e suas licenças. O pacote funciona sem Node, npm ou Python no computador do jogador. Se você preparar o acervo antes, seu pacote pessoal incluirá os PDFs e índices locais. Para publicar uma distribuição do código, compile sem esses arquivos ou assegure os direitos de distribuição; o repositório não concede direitos sobre material de terceiros.

O Windows usa `Sangue-e-Cinzas.exe`. O Linux usa `Iniciar-Sangue-e-Cinzas.sh`. Extraia toda a pasta antes de abrir. Dados portáteis ficam em `dados`; em desenvolvimento, o Electron usa seu diretório de dados do usuário. Fichas `.dav20.json` funcionam nas duas plataformas. Livros ou dados pessoais não devem ser adicionados ao Git.

## Recursos e limites

- Distribuição inicial, pontos de bônus, histórico da base e experiência com registro de compras.
- Clãs, Caminhos, disciplinas, vantagens, trilhas, rituais e equipamentos.
- Sangue, vontade, vitalidade, cura, armadura, iniciativa e testes D10.
- Modificadores positivos/negativos grandes, durações de cena/turnos e valores sem corte silencioso.
- Salvamento automático, backup anterior, vários personagens e desfazer/refazer.
- PDF completo em português e ficha oficial editável quando seu PDF está disponível.
- Pesquisa em worker e consulta das fontes locais depois de configurar a biblioteca.

Efeitos narrativos e exceções de poderes dependem do Narrador. Consulte [REGRAS.md](REGRAS.md), [CATALOGO.md](CATALOGO.md), [VALIDACAO.md](VALIDACAO.md) e [VALIDACAO-LINUX.md](VALIDACAO-LINUX.md). Os resultados históricos de validação descrevem a distribuição pessoal original com livros, não uma garantia para todo ambiente.

Projeto pessoal, não oficial. O código mantém a declaração **UNLICENSED** do aplicativo original; nenhuma licença aberta nova foi escolhida. Livros, marcas e outros materiais de jogo pertencem a seus respectivos titulares. As licenças das dependências são preservadas pelo npm e pelos empacotadores.
