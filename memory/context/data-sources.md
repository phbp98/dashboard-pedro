# Fontes de dados (source of truth)

## Arquitetura real (confirmada no código do index.html, 02/07)
- **Frontend = UM dashboard monolítico**: `index.html`, **~12.255 linhas / 463 KB**, título
  "Dashboard Pedro — v161 Drive Sync Seguro". Contém tudo em abas/seções: vida ("Hoje"/check-in),
  emprego ("Empresas", tarefas), docs ("CV real", "Links"). Os "3 dashboards leves" do prompt de
  contexto **não existem como arquivos** — são seções deste monolito.
- **URL (GitHub Pages)**: https://phbp98.github.io/dashboard-pedro/
- **Repo**: https://github.com/phbp98/dashboard-pedro
- **Dados: web app do Apps Script → Google Sheet.** O index.html busca de um endpoint
  `script.google.com/macros/s/.../exec` (SENSÍVEL — serve dado pessoal; não publicar). Esse endpoint
  expõe o **Google Sheet Master no Drive**, que é a **fonte da verdade**.
- **`localStorage` = cache** (aparece ~12x no código), não persistência principal.
- Outro arquivo: `PHBP_job_search_dashboard_complete_with_contacts.html` (36 KB, em `Outros/` e
  `Recherche d'emploi/`) é um dashboard de emprego **separado/antigo** — NÃO é cópia do index.html.

## Google Sheet Master (fonte da verdade)
- ID: `1EwIrTyIlUXO-HRgBOH92vNz0G0SbNtLVq_iAgM5fHTw`  ·  dono: pedrohenriquebp98@gmail.com
- Abas: Daily_Log, Tasks, Job_Search, Top30_Targets, Targets_Full_DB (219 empresas),
  LinkedIn_Contacts (~58), CV_Lettres, Spending, Food, Exercise, Screen_Time, Calendar.
- Backups locais (NÃO são a verdade): `Pedro_Dashboard_MASTER.xlsx` (241 KB, raiz) e `..._v2.xlsx`.

## Google Forms (entrada de dados)
- Manhã: id `1Xl3aD25pCeIfLmxoO5BlCYL1yC006EfyoquG8wLLvMM`
- Noite: id `1vmVoVl44wLp1RUqCBOAhI23HQbI1DJZBnyqIHFCtQXA`

## Lembretes (Google Calendar, diários, Europe/Paris)
- 08:30 — event id `lqhl62squognh8f2dd4fuol0os`  ·  22:00 — event id `u35upajeksu2qi55krnrpimfrk`

## Acesso do Claude
- Nuvem: Google Drive / Calendar / Gmail (conectores).
- PC local: Windows-MCP -> leitura/escrita em `C:\Users\pedro\Dashboard-Pedro`.

## API do Apps Script — LEITURA (Código.gs, doGet)
- GET `.../exec` (opcional `?callback=fn` -> JSONP; sem callback -> JSON). Retorna `{ok:true,data:{...}}`.
- Usa `getDisplayValues()` (evita bug de data 1899). Devolve 14 abas.
- SEGURANÇA: o doGet NÃO valida `key`. A key do index.html é decorativa -> o endpoint é público e
  serve TODOS os dados a quem tiver a URL (que está no HTML público). Corrigir: endpoint privado ou
  remover abas sensíveis da API.

## API do Apps Script — ESCRITA
- NÃO há endpoint HTTP de escrita (sem doPost). Escrita = via Google Form -> trigger onFormSubmit
  (FormDashboardAutomation.gs), que distribui a resposta pras abas com dedup e lógica de data.
- Escrever direto no Daily_Log (ex.: via ChatGPT) PULA o fan-out -> sub-abas ficam sem dado. Para
  check-in, usar o Form.
- Escrita programática do Claude (pipeline/contatos): criar um doPost com key real (resolve segurança
  + habilita Claude a gravar). Tarefa da fase de código.

## SyncAuto.gs (automação horária)
- Sincroniza Calendar -> aba Calendar, e a pasta de CVs no Drive -> aba CV_Lettres (1x/h + onOpen).
- Pasta de CVs no Drive: id `1HEcc7gcwY-2rn25bmpdlTnrzj2XBC8VG` (dentro de "dashboard Pedro" > "Documentos").

## Privacidade
Abas de saúde/gastos/alimentação são sensíveis. Ler só sob pedido. Nunca expor dado pessoal nem o
endpoint /exec em arquivo público (GitHub) ou outreach.