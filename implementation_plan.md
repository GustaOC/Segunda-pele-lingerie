# Substituir Seletor de Período por Calendário de 7 Dias

O dashboard atualmente possui um menu suspenso (Select) de período ("Últimos 7 dias", "Últimos 30 dias", etc.) que não tem efeito real na filtragem de dados. A ideia é substituí-lo por um DatePicker (Calendário) onde o usuário é forçado a visualizar os dados num intervalo de exatos 7 dias.

## User Review Required
> [!IMPORTANT]
> **Sobre o Calendário de 7 dias**: 
> Como o usuário deverá "escolher 7 dias obrigatoriamente", a melhor e mais fácil forma para o uso (UX) é você selecionar **apenas uma data no calendário** (como data de início) e o sistema automaticamente selecionará aquela data e os 6 dias seguintes, formando os 7 dias exatos. Outra opção seria fazer o usuário clicar na data inicial e depois clicar na data final. A primeira opção é mais rápida e infalível. Você aprova a primeira opção (clicar num dia e o sistema pega a semana a partir dali)?

> [!IMPORTANT]
> **Sobre a filtragem dos dados**:
> Atualmente as métricas ("Total de Cadastros", "Taxa de Aprovação") refletem o tempo todo de vida do sistema (todos os leads já cadastrados). Se o período escolhido for modificado para os 7 dias selecionados no calendário, você deseja que **todos os números e gráficos** do dashboard mudem para mostrar APENAS o que aconteceu naqueles 7 dias exatos escolhidos? 

## Proposed Changes

### DashboardClient
#### [MODIFY] [DashboardClient.tsx](file:///home/bruno/Documents/Vscode/Segunda-pele-lingerie-main/app/admin/(protected)/dashboard/DashboardClient.tsx)
- Remover o state `selectedPeriod` e o componente `Select`.
- Adicionar um state `selectedDate` e utilizar o componente `<Popover>` e `<Calendar>` (shadcn/ui) para permitir a escolha de uma data.
- Atualizar o `useMemo` do processamento de dados (`allLeads`) para **filtrar todos os leads** considerando apenas aqueles cuja data de `createdAt` esteja entre a data escolhida e os próximos 6 dias (formando 7 dias).
- Atualizar a geração das datas do gráfico (atualmente fixo nos últimos 7 dias usando `new Date()`) para ser flexível e iterar a partir da data escolhida no calendário.
