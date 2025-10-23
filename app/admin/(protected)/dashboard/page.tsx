// app/admin/(protected)/dashboard/page.tsx

import { createClient } from "@/lib/supabase/server";

import { redirect } from "next/navigation";

import DashboardClient from "./DashboardClient";

import PaymentDuePage from "./PaymentDuePage";



// --- LÓGICA DE BLOQUEIO FINAL ---

const isPaymentOverdue = () => {

  /**

   * MODO DE CONTROLE:

   * - 'AUTO': Usa a data real (bloqueia o sistema após o dia 15).

   * - 'FORCE_LOCK': Força o bloqueio do sistema (para testar).

   * - 'FORCE_UNLOCK': Força o DESBLOQUEIO do sistema (para liberar o acesso).

   */

  const CONTROL_MODE: 'AUTO' | 'FORCE_LOCK' | 'FORCE_UNLOCK' = 'FORCE_LOCK'; // Alterar conforme necessário



  if (CONTROL_MODE === 'FORCE_LOCK') {

    return true; // Sistema bloqueado

  }

  if (CONTROL_MODE === 'FORCE_UNLOCK') {

    return false; // Sistema desbloqueado

  }



  // Se o modo for 'AUTO', usa a verificação de data

  const today = new Date();

  const dueDate = 15;

  if (today.getDate() > dueDate) {

    return true; // Vencido

  }

  

  return false; // Em dia

};

// --- FIM DA LÓGICA DE BLOQUEIO ---



export default async function AdminDashboardPage() {

  if (isPaymentOverdue()) {

    return <PaymentDuePage />;

  }



  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();



  if (!user) {

    return redirect("/admin/login");

  }



  return <DashboardClient user={user} />;

}
