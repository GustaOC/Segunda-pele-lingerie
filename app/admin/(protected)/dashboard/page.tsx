// app/admin/(protected)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient"; // Importaremos o componente cliente

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Se não houver usuário, o middleware já deveria ter redirecionado,
    // mas esta é uma camada extra de segurança.
    return redirect("/admin/login");
  }

  // Passamos o usuário como prop para o componente que contém a UI.
  return <DashboardClient user={user} />;
}