# Regras implementadas e limites da automação

O sistema de referência é **Vampire: The Dark Ages 20th Anniversary Edition (DAV20)**. O motor não usa os valores de criação de Vampire: The Masquerade V20 moderno. Os arquivos fornecidos pelo usuário ficam em `../vtm v20/`; a biblioteca do aplicativo apresenta os originais para consulta.

As páginas abaixo são as páginas **impressas** do núcleo. No PDF fornecido, a página do arquivo costuma ser a página impressa mais um.

| Área | Comportamento do aplicativo | Fonte no núcleo |
| --- | --- | --- |
| Atributos | Um ponto inicial por atributo; distribuições adicionais 7/5/3. Nosferatu começa com Aparência zero. | pp. 152, 156 |
| Habilidades | Distribuições 13/9/5; máximo três pontos antes dos bônus. Talentos, Perícias e Conhecimentos da ficha oficial DAV20. | pp. 153, 156, 162–174 |
| Vantagens | Quatro pontos de Disciplinas do clã, cinco de Antecedentes e sete de Virtudes além de um ponto inicial em cada uma. Convicção e Instinto também recebem o ponto inicial no DAV20. | pp. 153–154, 156 |
| Caminho e vontade | Na distribuição inicial, Caminho = Virtude moral + Virtude de controle e Força de Vontade = Coragem. Após registrar a base, essas características têm valores independentes. Elevar uma Virtude com XP não aumenta os valores derivados. | pp. 154, 183–185 |
| Bônus | Quinze pontos, com crédito padrão máximo de sete pontos de Defeitos. Custos por ponto: Atributo 5, Habilidade 2, Disciplina 7, Antecedente 1, Virtude 2, Caminho 2, Força de Vontade 1, trilha de magia 4. Ritual custa seu nível. | pp. 155–158 |
| Geração | Inicial padrão 12; cada ponto no Antecedente Geração diminui um. A tabela define limite de características, sangue máximo e gasto por turno. A Terceira Geração não tem sangue ou gasto numéricos publicados na tabela. A campanha deve defini-los para controlar esses recursos. | pp. 180, 341 |
| Sangue inicial | Um d10 + pontos de Domínio + Rebanho, limitado ao máximo da geração. O resultado e a aplicação do limite aparecem na explicação. | pp. 154–155 |
| Rapidez | Adiciona dados a paradas de Destreza e à Iniciativa, sem aumentar os pontos permanentes do Atributo. | p. 202 |
| Fortitude | Adiciona dados às paradas de Vigor e à absorção de dano contundente e letal. Seus próprios dados absorvem agravado. | p. 221 |
| Potência | Adiciona dados às paradas de Força, sem alterar seu valor permanente. | p. 234 |
| Dados | D10 com dificuldade padrão 6. Resultados iguais ou maiores que a dificuldade são sucessos; cada 1 cancela um sucesso dos dados. | pp. 322–323 |
| Especialidades | Quando a especialidade se aplica, cada 10 equivale a dois sucessos. O aplicativo não rerrola os resultados 10. O usuário indica se a especialidade é pertinente. | p. 323 |
| Falha crítica | Exige nenhum sucesso bruto nos dados e pelo menos um resultado 1. Sucessos cancelados até zero produzem falha comum; o exemplo de jogo de p. 325 confirma essa diferença. Dano e absorção nunca produzem falha crítica. | pp. 322–325, 344–345 |
| Força de Vontade | Garante um sucesso adicional, que os resultados 1 não cancelam. O recurso é descontado quando a interface confirma a rolagem. Limite de um uso dessa forma por turno e permissões de uso são decisões da mesa. | pp. 323, 339–340 |
| Habilidades sem treinamento | Talento zero não altera a dificuldade; Perícia zero acrescenta um; Conhecimento zero exige decisão do Narrador ou modo livre. | pp. 153, 162, 166, 170 |
| Iniciativa | 1d10 + Destreza + Raciocínio + Rapidez + modificadores − penalidade dos ferimentos/armadura. | p. 343 |
| Vitalidade | Sete níveis com penalidades 0/−1/−1/−2/−2/−5/incapacitado. Ferimentos mais graves ficam no começo da trilha. Ferimentos não reduzem paradas reflexivas, incluindo absorção. | pp. 184–185, 350–352 |
| Dano contundente | A entrada normal é dano que restou após absorção. Divide por dois e arredonda para baixo. É possível desmarcar a divisão se o valor informado já foi reduzido. Uma trilha inteiramente contundente permite agir com −5. | p. 345 |
| Dano excedente | Com a trilha cheia, contundente agrava ferimentos para letal; letal agrava para agravado. Trilha cheia de ferimentos não contundentes entra em torpor. Trilha mista com contundente incapacita e permite cura quando há sangue. Incapacitado sem sangue entra em torpor. | pp. 184–185, 345, 350–352 |
| Morte Final | Sete ferimentos agravados, ou novo agravado recebido incapacitado/em torpor, causam Morte Final. | pp. 345, 351 |
| Cura | Um ponto de sangue por nível contundente/letal, respeitando o gasto por turno. Agravado custa cinco por nível e exige dia completo de repouso. Torpor exige primeiro resolver o despertar com o Narrador. | pp. 340, 345, 351 |
| Torpor | A duração de referência depende do Caminho, de um dia (10) a cinco séculos (1); Caminho zero corresponde a milênio ou mais. | p. 351 |
| Equipamento | Armadura marcada como equipada soma absorção e sua penalidade reduz Destreza/Iniciativa. Armadura não protege contra fogo e sol. Valores de armas e peso são registros de equipamento; ataques especiais não são inferidos do nome. | pp. 345, 350 |

## Auditoria de criação

O programa mantém uma cópia da distribuição inicial quando se escolhe registrar a base. A auditoria continua verificando essa cópia mesmo quando a ficha recebe bônus ou evolução. Antes disso, os valores atuais são a distribuição inicial; o aplicativo não tenta adivinhar quais pontos foram comprados com bônus.

Depois de registrar a base, as diferenças positivas entre os pontos permanentes e a base são contabilizadas pelos preços de bônus. Aumentos registrados pelo comprador de XP são retirados dessas diferenças. Isso permite mostrar cada característica, quantidade e custo sem contar o mesmo aumento como bônus e experiência.

Trilhas e rituais têm seus custos de bônus mesmo se foram adicionados antes do registro da base. Uma concessão prevista em regra ou aprovada pelo Narrador pode ser marcada como concedida. Essa opção é explícita: o motor não presume que toda trilha de magia ou todo ritual seja gratuito. Por exemplo, o núcleo concede um ritual de nível um ao aprender o primeiro nível de Taumaturgia (p. 303); o aplicativo permite registrar essa concessão. Regras específicas de trilhas, krainas, disciplinas mágicas e linhagens precisam da conferência do livro.

Reduções abaixo da base somada às compras de XP geram aviso. Não são tratadas automaticamente como devolução de pontos. Reduções e concessões durante a crônica devem ser registradas nas notas/diário para que o Narrador possa acompanhar a mudança.

## Experiência

A compra exige identificar a história e respeita um aumento da mesma característica por história. O valor atual determina o preço. A autorização de Antecedentes fica explícita, pois sua aquisição normal vem da história.

| Compra | Custo de XP |
| --- | --- |
| Habilidade nova | 3 |
| Habilidade existente | Valor atual × 2 |
| Atributo | Valor atual × 4 |
| Disciplina nova | 10 |
| Disciplina do clã | Valor atual × 5 |
| Disciplina de fora do clã | Valor atual × 7 |
| Trilha nova de Necromancia/Taumaturgia | 7 |
| Trilha secundária existente | Valor atual × 4 |
| Ritual de magia de sangue | Nível × 2 |
| Virtude/Caminho | Valor atual × 2 |
| Força de Vontade | Valor atual |
| Antecedente existente, autorizado | Valor atual × 2 |

Fonte: núcleo, pp. 184–185. O livro não fornece preço separado de XP para Antecedente zero → um; o aplicativo pede uma concessão/definição do Narrador em vez de inventar um preço. A regra de Disciplina de Caitiff × 6 de outras edições não foi acrescentada à tabela DAV20 sem uma fonte correspondente. O custo de trilha primária não é comprado isoladamente quando a regra a vincula à Disciplina; registre a concessão e a compra apropriada da Disciplina.

## Modificadores e preservação de dados

Modificadores têm nome/origem, destino e duração. Destinos incluem Atributos, Habilidades, parada de dados, dificuldade, Iniciativa e limites de campanha. Durações podem ser permanente, cena ou número de turnos. Avançar turno e encerrar cena desativam os efeitos correspondentes e informam seus nomes.

Valores altos e negativos são preservados ao salvar, exportar e importar. Números fora da precisão inteira segura do JavaScript, resultados de cálculo fora dessa precisão e dados inválidos são recusados com uma mensagem. Não há corte silencioso para 999/9999. Uma parada nunca tem menos de zero dados; o número original do modificador permanece intacto. Uma única rolagem permite até 100.000 dados para preservar desempenho; essa restrição não muda a ficha.

Uma reserva atual acima do limite da geração/Caminho gera aviso e permanece intacta. Mudanças de geração, limites ou vontade permanente não apagam recursos. Recuperação que excederia um limite é recusada antes de alterar a reserva. O despertar só devolve vontade se a reserva estiver abaixo do valor permanente.

Modo livre permite características, orçamentos e exceções próprias da campanha. A auditoria padrão é informativa e aponta diferenças, sem cortar valores. Limites técnicos de precisão e integridade continuam necessários em ambos os modos.

## O que exige decisão da mesa

A leitura de páginas e o registro de Disciplinas, trilhas, rituais, Méritos, Defeitos e fraquezas não significam que todos seus efeitos estejam automatizados. O motor executa as regras gerais acima e as três Disciplinas físicas passivas. Outros poderes dependem de alvos, distâncias, custos, oposição, condições e interpretação; use as fichas de referência e registre modificadores/contexto.

Uso ativo de Potência/Fortitude, ações múltiplas e Rapidez ativa, poderes de ancião, caminhos mágicos, diablerie, maldições de linhagem, frenesi, Rötschreck, juramentos de sangue, despertar do torpor, exceções de Méritos/Defeitos e alterações da crônica exigem conferência do Narrador. Não se presume aprovação porque uma opção existe no catálogo. A preferência alimentar Ventrue é registrada como texto, sem inferir se uma alimentação satisfaz a maldição.

Estacado/inconsciente impedem ações normais. Paradas reflexivas ainda permitem resolver o que a regra e o Narrador autorizam; Morte Final impede ações e absorção. Curar uma ficha em torpor primeiro exige registrar a decisão de despertar; o programa não transforma simples gasto de sangue em despertar automático.

## Contrato do motor para manutenção

`app/engine.js` exporta `Rules` no navegador e CommonJS nos testes. As notas técnicas abaixo servem à manutenção do aplicativo.

- `create(name)` fornece uma ficha nova. Atributos e Habilidades ficam em dicionários; listas têm identificadores próprios. `resources` contém sangue/vontade atuais, enquanto `willpower` é o valor permanente. `health` contém os três tipos de dano e o estado vital.
- `calculate(c)` retorna auditoria, avisos, valores para paradas, limites, penalidade/trilha de saúde, absorção e decomposição dos cálculos. `attributes` e `effective.attributes` incluem dados passivos; os pontos permanentes continuam em `c.attributes` ou `attributeRatings`.
- `freezeCreation(c)` registra a base e muda para bônus. `enterPlay(c)` muda para crônica, mantendo a base. As transições não apagam recursos nem distribuições divergentes.
- `roll(c, options, rng)` retorna dados, sucessos, resultados 1, falha crítica e explicação. `options` aceita parada, dificuldade, modificador, especialidade, vontade, Habilidade, ação reflexiva, dano e absorção. A rolagem não desconta recursos; o chamador confirma e executa o gasto uma única vez.
- `spend/recover` controlam recursos; `applyDamage/heal` resolvem ferimentos; `advanceTurn/endScene` expiram efeitos. `startNight/startingBlood` implementam os procedimentos descritos acima.
- `buyWithXP(c,{type,key,story,...})` altera a característica e cria seu registro de aquisição após verificar custo, recursos e restrições. O tipo usa o nome singular em inglês; o destino é chave de Atributo/Habilidade/Virtude ou identificador da opção de lista.
- `pack/validateImport` usam o formato `vampire-dark-ages-v20`, versão 1. Importação para cópia gera identificadores novos e remapeia a base e o histórico de XP juntos. Leitura local pode preservar identificadores. Listas/valores corrompidos, outro sistema e versões desconhecidas são recusados sem truncar entradas.

Verificação: `node tests/engine.test.cjs`, a partir da pasta `vampiro`. Os testes cobrem a distribuição e custos, exceções de geração, preservação de números altos, dados, especialidades, falhas, vontade, ações reflexivas, ferimentos/overflow/cura, efeitos temporários, compras de XP e importação com remapeamento da base.
