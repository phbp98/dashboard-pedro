# Dashboard HTML — descrição e regras de edição

Referência para quando o Claude editar o dashboard. **Existe UM dashboard que roda**: `index.html`,
**monolito de ~12.255 linhas / 463 KB, versão v161** ("Drive Sync Seguro"). Contém tudo em abas
(vida/emprego/docs) — os "3 dashboards leves" do prompt são seções deste arquivo, não arquivos
separados. Ele lê o Google Sheet via web app do Apps Script; `localStorage` é cache. O
`PHBP_job_search_..._contacts.html` (36 KB, em `Outros/` e `Recherche d'emploi/`) é um dashboard de
emprego **separado/antigo**, não o index.html. O index.html que roda mora na pasta do repo GitHub.

## O que o dashboard faz
Pipeline de candidaturas, tarefas/follow-ups, empresas-alvo com fit score, contatos LinkedIn, e
aba "Balanço para Coach". Lê o dado do Google Sheet Master (Drive); localStorage como cache local.

## Regras de código
- **JavaScript compatível (base ES5)**: o critério é não quebrar (browser, GitHub Pages, Apps Script).
- **Validar SEMPRE antes de entregar**: `node -e "new Function(require('fs').readFileSync('arquivo','utf8'))"`.
- **Datas** `YYYY-MM-DD`; horas `HH:mm`. Cuidado com o bug de horário virar data 1899.
- Não reescrever o HTML inteiro sem necessidade; mudanças pequenas, um problema por vez; explicar o
  que mudou e como testar; backup antes de mudança grande.
- Não inventar IDs, URLs ou nomes de abas; não usar placeholder quando há valor real.

## Riscos conhecidos
- Cópia do HTML em 2 pastas → editar uma não atualiza a outra; eleger a oficial.
- Misturar dado antigo do localStorage com dado real.
- Publicar dado pessoal sensível no GitHub Pages.