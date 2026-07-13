"use client";

import { useState } from "react";
import { User, Package } from "lucide-react";

export default function AcertoRevendedora({ isPromoter }: { isPromoter: boolean }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Acerto com Revendedora</h3>
        <p className="text-slate-500 max-w-md mx-auto mb-6">
          Nesta tela, o promotor poderá realizar o acerto financeiro e de estoque com suas revendedoras.
          Selecione uma revendedora para visualizar os kits entregues a ela, contar as peças não vendidas e finalizar o acerto.
        </p>
        <div className="inline-flex items-center justify-center p-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-sm">
          Aguardando definições de regra de negócio (comissões e retornos de estoque) para finalizar esta tela.
        </div>
      </div>
    </div>
  );
}
