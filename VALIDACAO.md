> Este relatório descreve a distribuição pessoal original, feita com Electron 40.4.0. O repositório público usa Electron 43.7.7; veja VALIDACAO-REPOSITORIO.md para suas verificações.

# Validação — versão 1.0.0

Os testes usam o aplicativo e os PDFs fornecidos. O programa não é um simulador de todas as decisões narrativas de DAV20; a cobertura das regras está em REGRAS.md.

- 36 testes de regras: distribuição, bônus, experiência, geração, dados, vontade, saúde, cura, armadura, efeitos temporários, números altos e importação.
- 5 testes de impressão: pontos permanentes e dados modificados, recursos, campos oficiais, escape de texto e conteúdo extenso.
- 2 verificações independentes do formulário oficial: 992 campos e widgets preservados nas quatro páginas, valores canônicos, aparências preenchidas, acentos e vitalidade. Os dois botões de imagem permanecem intocados. Os 2.037 streams originais das caixas de marcação são preservados; estados desmarcados transparentes completam o formulário sem desenhar bordas extras.
- 18 fluxos na interface Electron: criação até crônica, compras de XP, equipamentos, combate, especialidades, +20.000, durações, compartilhamento, busca, fontes, ambos os PDFs e histórico após reabrir. Nenhuma exceção da interface.
- As 12 telas foram abertas; janela de 960 × 720 foi verificada sem rolagem horizontal.

## Desempenho observado

Uma execução isolada abriu a interface em 817 ms. Com a CPU do processo de interface artificialmente quatro vezes mais lenta, a navegação ficou entre 33 e 172 ms e as pesquisas entre 80 e 374 ms. O corpus não entrou na memória da interface; o heap observado foi de 10 MiB. Digitação, foco, controles de rolagem e rascunho do diário foram preservados. Esses números são observações deste ambiente, não garantia de tempo em qualquer computador.

Teste reproduzível: `node tests/performance.cjs` com Electron/Playwright e sessão gráfica. As buscas são paginadas e executadas em um worker; o salvamento assíncrono é agrupado após as edições.

## PDFs

A ficha de exemplo foi renderizada e inspecionada em duas páginas, sem folhas apenas de rodapé. Uma ficha extensa gerou dez páginas: as dez foram inspecionadas, sem cortes ou sobreposições. Os 105 marcadores de final de registros/notas permaneceram no texto extraído. Acentos, notas, fontes e modificadores altos foram conferidos. A ficha oficial tem quatro páginas e mantém seus campos interativos.

## Executável Windows

A distribuição inclui o runtime oficial Electron 40.4.0 Windows x64, conferido por SHA-256. O executável é PE32+ para Windows x64; não exige Node/Python instalados no computador do jogador.

`tests/windows.cjs` abriu o executável sob Wine em um ambiente isolado e verificou interface, acentos portugueses, fraqueza de clã, pesquisa, +20.000 após recarregar, desfazer/refazer, salvamento na pasta portátil `dados`, exportação `.dav20.json`, PDF completo e PDF oficial editável. O teste passou sem exceções da interface. A primeira exportação demorou mais do que o limite inicial do teste; aumentando a espera para até 45 segundos, ambos os PDFs foram gerados. Esse limite de espera pertence ao teste, sem alterar a aplicação.

O teste de compatibilidade foi realizado sob Wine em Linux, não em uma máquina física com Windows. As verificações de regras e PDFs complementam esse teste; os tempos medidos não garantem o comportamento em todo hardware.

## Pacote entregue

O empacotador verifica o SHA-256 do runtime, a integridade CRC do ZIP e a presença do executável. O pacote contém os quatro PDFs originais, aplicativo e instruções; `dados` começa vazio, sem fichas, perfis ou histórico dos testes. A distribuição 3D&T e seu arquivo de checksums não são sobrescritos. O arquivo de SHA-256 da nova distribuição fica ao lado do ZIP.
