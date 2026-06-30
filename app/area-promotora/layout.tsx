import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AreaPromotoraLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Aqui poderíamos ter um Header/Sidebar exclusivo da promotora no futuro */}
      {children}
    </div>
  )
}
