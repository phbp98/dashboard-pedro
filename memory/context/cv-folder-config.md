---
name: cv-folder-config
description: Localização e ID da pasta de CVs sincronizada com o dashboard
metadata:
  type: project
  updated: 2026-07-06
---

# Configuração da pasta de CVs — Google Drive

## Local
- **Pasta**: "Documentos" dentro de "dashboard Pedro"
- **ID**: `1HEcc7gcwY-2rn25bmpdlTnrzj2XBC8VG`
- **Caminho completo**: Google Drive > "dashboard Pedro" > "Documentos"
- **Proprietário**: pedrohenriquebp98@gmail.com

## Conteúdo sincronizado
A pasta contém:
- **11 CVs em PDF**: FR, EN, BR, mais versões específicas por vaga (Qcells, IPC, Pochet, Syntetica, Channel, Deloitte, Post Doc, Sia)
- **5 Cartas de motivação**: post doc (DOCX+PDF), Amcor (DOCX+PDF), Syntetica (PDF), Qcells (PDF)
- **Documentos de referência**: Bilan de Compétences (PDF), Objectif du Projet de Recherche (PDF), References Qcells (PDF), Plano de Escrita de Artigos (PDF)
- **Planilha**: PHBP vagas aplicadas.xlsx
- **Foto**: photo.png

## Sincronização automática
- **Script**: SyncAuto.gs (dentro do Google Sheet Master)
- **Frequência**: 1x/hora + onOpen (ao recarregar o Sheet)
- **Alvo**: Aba "CV_Lettres" do Google Sheet Master
- **Status**: ✅ Funcionando (testado 2026-07-06)

## Histórico de mudanças
- **2026-07-06**: Relocada de pasta antiga (id `1qxEFH5xNdEbTyl_Y7bLyGc12p13wSFcc`, vazia) para "Documentos" dentro de "dashboard Pedro". Script SyncAuto.gs atualizado para apontar ao ID correto.
