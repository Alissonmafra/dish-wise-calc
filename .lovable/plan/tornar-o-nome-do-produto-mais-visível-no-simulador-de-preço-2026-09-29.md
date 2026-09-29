# Tornar o nome do produto mais visível no Simulador de Preço de Venda

## Problema
Na tela de Precificação (Simulador de Preço de Venda), o seletor de produto tem largura fixa de 180px e nomes longos são cortados ("URAMAKI DE...").

## Solução
Em `src/pages/Precificacao.tsx` (tabela do simulador):
1. Aumentar a largura do seletor de produto de `w-[180px]` para `min-w-[220px]` (acompanha nomes longos).
2. Deixar o texto do produto selecionado em peso médio (`font-medium`) e sem truncamento agressivo, para o nome completo ficar legível.

## Fora do escopo
- Nenhuma alteração de cálculos, dados salvos ou demais telas.
