// app/admin/(protected)/dashboard/PaymentDuePage.tsx
"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PaymentDuePage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="p-8 bg-white rounded-2xl shadow-xl max-w-md text-center border">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Acesso Suspenso
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          O pagamento da mensalidade não foi identificado. Por isso, não será possível acessar o sistema.
        </p>
        <p className="text-gray-600 mt-6 text-base">
          Para regularizar sua situação e reativar o acesso, envie o comprovante de pagamento ao proprietário do sistema para liberação.</p>
          <p className="text font-bold text-gray-800 mb-3"></p>
          <p className="text font-bold text-gray-800 mb-3">
  Gustavo Oliveira - (67) 9.9269-0768
</p>
        
        <Button
          onClick={handleLogout}
          variant="outline"
          className="mt-8 w-full text-lg py-6 rounded-xl"
        >
          Sair
        </Button>
      </div>
    </div>
  );
}