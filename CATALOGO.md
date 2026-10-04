# Catálogo de fontes DAV20

O acervo de referência foi preparado com quatro PDFs de DAV20. A distribuição pessoal original indexou **732 páginas de PDF** e **770 referências classificadas**. Este repositório público não inclui os documentos nem os textos extraídos. Adicione seus próprios PDFs com `scripts/import_library.py`; sem esse passo, o criador continua funcionando e a biblioteca informa que não foi configurada.

| Livro | Arquivo local | Páginas | Referências |
| --- | --- | ---: | ---: |
| Vampire: The Dark Ages 20th Anniversary Edition | core.pdf | 476 | 635 |
| V20 Dark Ages Companion, tradução fornecida | companion.pdf | 133 | 34 |
| V20 Dark Ages: Tome of Secrets | secrets.pdf | 119 | 101 |
| Ficha oficial interativa DAV20 | ficha-oficial.pdf | 4 | 0 |

**Todas as referências usam a posição da página no PDF, começando em 1.** Nos três livros, a numeração impressa costuma ser uma unidade menor. Por exemplo: Auspex começa na página 195 do PDF, impressa como 194. O botão de fonte e a biblioteca usam a posição do PDF.

| Categoria | Referências |
| --- | ---: |
| Cenário e criaturas | 9 |
| Caminhos e trilhas morais | 33 |
| Regras e variantes | 5 |
| Poderes | 345 |
| Rituais | 109 |
| Qualidades | 37 |
| Linhagens | 20 |
| Trilhas e krainas de feitiçaria | 29 |
| Antecedentes | 15 |
| Clãs | 13 |
| Arquétipos | 43 |
| Disciplinas | 31 |
| Disciplinas combinadas | 30 |
| Defeitos | 51 |

## O que foi revisado

O arquivo pequeno `choices.js` contém escolhas para a interface: os 13 clãs e 19 opções de linhagem/casta do livro básico, 24 Caminhos/trilhas morais, 31 Disciplinas, 43 arquétipos e os Antecedentes encontrados nas fontes. Nomes canônicos em inglês vinculam as escolhas; rótulos em português facilitam a edição. Afinidades, combinações de Virtudes, referências e resumos de fraquezas foram conferidos nos trechos correspondentes.

As escolhas com herança de clã (Filhos de Osíris e Kiasyd) informam que outras duas Disciplinas devem ser escolhidas do clã original. As castas de Valeren e Quietus são nomes distintos no catálogo. A ficha básica dos Assamitas descreve os Vizires; por isso essa opção está identificada como Assamita (Vizir), sem atribuir suas afinidades às outras castas.

Custos explícitos de Qualidades e Defeitos foram lidos das fontes. Custos variáveis conservam a lista de valores permitidos; o valor inicial tem a menor magnitude. O Narrador deve escolher a variante apropriada. Níveis explícitos de poderes e rituais foram indexados de 1 a 9. Uma referência indexada não significa que todas as condições, gastos, pré-requisitos e consequências desse efeito estejam automatizados na ficha.

## Extração e OCR

Os trechos do catálogo são extraídos das fontes, com correção de ligaturas, hifenização de fim de linha e a tipografia de títulos em versaletes. **Os corpos dos 770 verbetes não receberam revisão editorial integral.** O PDF continua sendo a fonte principal para conferir contexto, tabelas e exceções.

O Companion fornecido traz a marca de tradução automática e possui imagens sem camada de texto em grande parte do documento. Foi feito OCR offline em português e inglês para **99 páginas**: a terceira página do sumário e as páginas 36–133. Esses resultados são marcados com `ocr: true`; todas as páginas do Companion também recebem `machineTranslated: true`. OCR e tradução automática podem trocar nomes, números, pontuação e a ordem das colunas. Algumas passagens já estavam sobrepostas na imagem original e permanecem difíceis de ler; consulte o PDF quando o trecho parecer incoerente.

Títulos do Companion que descrevem temas e criaturas não são apresentados como novos clãs por inferência. Kallikantzaros e Pishacha são referências de cenário; Ancestral Nobre e Jati são temas/variantes. O mérito Ravnos Jati é indexado separadamente com seu custo explícito. A pesquisa de páginas permite alcançar os suplementos completos mesmo onde ainda não há verbete individual.

## Arquivos e desempenho

- `metadata.js`: nomes de livros e categorias, com contagens iniciais zeradas; carregado pela interface. `library-local.json` acrescenta as contagens de seu acervo configurado.
- `choices.js`: escolhas e rótulos pequenos; carregado pela interface.
- `catalog.js` / `catalog.json`: páginas e referências; o corpus completo entra somente no processo de busca do worker.
- `books.json`: nomes seguros dos PDFs locais esperados.
- `coverage.json`: contagens verificáveis da geração.
- `search-worker.js`: busca sem diferenciar acentos ou maiúsculas, com todas as palavras da consulta, filtros de livro/categoria e resultados paginados.

O worker aceita `kind: "catalog"`, `kind: "library"` e `kind: "page"`. Listas usam páginas de resultados começando em 0; páginas de livro começam em 1. As respostas devolvem `id` e `result`, ou `id` e `error`. O texto integral não é reprocessado a cada tecla na interface.

## Regeneração

Execute `npm run library:import -- "/pasta/dos/pdfs" --ocr` para preparar seu acervo privado. O importador chama `scripts/build_catalog.py` após criar as extrações em `referencias/{core,companion,secrets,sheet}.txt`, os layouts XML dos três livros e o cache de OCR em `referencias/companion-ocr/page-*.txt`. O gerador atualiza apenas os índices locais ignorados pelo Git e imprime as contagens. Para reaproveitar uma instalação pessoal, passe a pasta `resources/app`, conforme o README. Não consulta a internet nem executa OCR ao iniciar o programa.

As extrações originais e o cache de OCR ficam fora do aplicativo distribuído. Os PDFs locais foram verificados por igualdade de conteúdo com os arquivos fornecidos. A validação do worker cobre contagem de páginas, filtros, acentos/palavras, níveis de rituais, custos variáveis, paginação e recuperação de páginas OCR.
