// app/admin/(protected)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redireciona para login se não houver usuário autenticado
    return redirect("/admin/login");
  }

  // Renderiza o componente cliente com o usuário autenticado
  return <DashboardClient user={user} />;
}