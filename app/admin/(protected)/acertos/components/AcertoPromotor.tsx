"use client";

import { useState } from "react";
import { Package, Search } from "lucide-react";

export default function AcertoPromotor() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Acerto com Promotor</h3>
        <p className="text-slate-500 max-w-md mx-auto mb-6">
          Nesta tela, o administrador poderá realizar o acerto financeiro e de estoque com os promotores.
          Selecione um promotor para visualizar seus kits em aberto e registrar as peças vendidas e devolvidas.
        </p>
        <div className="inline-flex items-center justify-center p-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-sm">
          Aguardando definições de regra de negócio (comissões e retornos de estoque) para finalizar esta tela.
        </div>
      </div>
    </div>
  );
}
