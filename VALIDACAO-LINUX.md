> Este relatório descreve a distribuição pessoal original, feita com Electron 40.4.0. O repositório público usa Electron 43.7.7; veja VALIDACAO-REPOSITORIO.md para suas verificações.

# Validação — Linux x64 1.0.0

O pacote Linux usa o aplicativo DAV20 e os mesmos quatro PDFs da edição Windows. As regras e a cobertura do acervo estão em REGRAS.md e CATALOGO.md.

## Empacotamento

O empacotador confere o arquivo oficial Electron 40.4.0 Linux x64 por SHA-256, inclui o aplicativo e suas dependências, os quatro livros, licenças e instruções. O arquivo tar.gz conserva as permissões de execução. `chrome-sandbox` não recebe permissões especiais; o lançador não desliga o sandbox.

Todos os arquivos do tar.gz são comparados por SHA-256 com a origem antes de publicar o pacote. A pasta `dados` começa vazia. Não entram perfis, fichas nem histórico dos testes. O script rejeita uma distribuição existente que contenha dados de usuário ou não tenha sido criada por esse empacotador. A distribuição Windows permanece separada.

## Ambiente

A edição exige Linux desktop x64, ambiente gráfico e bibliotecas usuais de GTK 3, NSS, ALSA, GBM e X11. O funcionamento do sandbox depende de namespaces de usuário permitidos pelo sistema. A distribuição não altera essa configuração e não instala arquivos fora da própria pasta. O ambiente de execução verificado foi Manjaro Linux x64; outras distribuições não foram testadas individualmente.

## Teste funcional

`tests/linux.cjs` reextraiu o tar.gz real em um caminho com espaços e acentos e passou 14 verificações, sem exceções da interface:

- Aplicativo empacotado real, Linux x64, dados junto do executável e sandbox ativo.
- As 12 telas abrem e os campos preservam nomes com acentos e a fraqueza do clã escolhido.
- Modificador +20.000, fichas e histórico são preservados após fechar e reabrir; desfazer/refazer funciona após reiniciar.
- Pesquisa no catálogo e na biblioteca, leitura textual de páginas e abertura de um PDF original local.
- Exportação e importação `.dav20.json` pelo aplicativo; a cópia importada recebe identificador independente.
- Geração dos PDFs completo e oficial pelo runtime Linux.
- Janela de 960 × 720 sem rolagem horizontal.
- Importação de uma ficha realmente exportada na edição Windows, preservando acentos e +20.000.
- O lançador incluído inicia o aplicativo e mantém os dados portáteis.
- Um perfil indicado explicitamente é respeitado sem alterar as fichas da pasta portátil.

O teste de integração usou a opção gráfica `--disable-gpu` por rodar em uma tela virtual. Nenhuma opção que desligue o sandbox foi usada: o teste habilitou `chromiumSandbox` no Playwright e confirmou `hasSwitch('no-sandbox') === false` e a preferência `sandbox === true` da janela real. O lançador entregue não acrescenta opções à aplicação.

Uma abertura adicional executou o lançador real com as opções padrão, sem `--disable-gpu` nem `--no-sandbox`: o aplicativo empacotado abriu a interface corretamente com o sandbox habilitado.

O PDF completo de exemplo gerou duas páginas; o PDF oficial gerou quatro e conservou seu formulário interativo. O texto extraído preservou os acentos e os valores +20.000 e 20.001 dados atuais.

Com sessão gráfica disponível: `node tests/linux.cjs`. Em ambiente de testes sem tela: `xvfb-run -a node tests/linux.cjs`. Playwright precisa estar disponível para o teste, mas não para usar a distribuição.

As proteções do empacotador também foram verificadas: ele recusa substituir uma pasta com fichas e recusa um destino desconhecido, preservando seu conteúdo. A checagem dos dados é repetida antes da substituição ao fim da compilação.
