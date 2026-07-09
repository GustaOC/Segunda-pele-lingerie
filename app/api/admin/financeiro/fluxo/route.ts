import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const anoStr = searchParams.get('ano');
    const ano = anoStr ? parseInt(anoStr) : new Date().getFullYear();

    // Fetch all transactions to calculate the correct historical balance
    const { data: allTransactions, error } = await supabaseAdmin
      .from('financial_transactions')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) throw error;

    let saldoHistorico = 0;
    
    // Array para os 12 meses do ano
    const meses = Array.from({ length: 12 }, () => ({
      receitas: 0,
      despesas: 0,
      resultadoMes: 0,
      saldoAcumulado: 0,
      grupos: {} as Record<string, number>
    }));

    allTransactions.forEach((t: any) => {
      const dt = new Date(t.due_date);
      // Ajuste de fuso horário
      dt.setMinutes(dt.getMinutes() + dt.getTimezoneOffset());
      const transactionYear = dt.getFullYear();
      const transactionMonth = dt.getMonth(); // 0 a 11
      const val = parseFloat(t.total_value) || 0;
      
      const isReceita = t.type === 'RECEIVABLE';
      const factor = isReceita ? 1 : -1;

      if (transactionYear < ano) {
        // Se for de anos anteriores, soma no saldo histórico inicial
        saldoHistorico += (val * factor);
      } else if (transactionYear === ano) {
        // Se for do ano atual, acumula no mês correspondente
        if (isReceita) {
          meses[transactionMonth].receitas += val;
        } else {
          meses[transactionMonth].despesas += val;
        }
        
        // Agrupar por categoria
        const groupName = t.category || (isReceita ? 'Outras Receitas' : 'Sem Categoria');
        if (!meses[transactionMonth].grupos[groupName]) {
          meses[transactionMonth].grupos[groupName] = 0;
        }
        meses[transactionMonth].grupos[groupName] += val;
      }
    });

    // Calcular Resultados e Saldos Acumulados
    let saldoAtual = saldoHistorico;
    meses.forEach((mes, idx) => {
      mes.resultadoMes = mes.receitas - mes.despesas;
      saldoAtual += mes.resultadoMes;
      mes.saldoAcumulado = saldoAtual;
    });

    return NextResponse.json({
      ano,
      saldoInicialAno: saldoHistorico,
      meses
    });

  } catch (error: any) {
    console.error('Error calculating fluxo de caixa:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
