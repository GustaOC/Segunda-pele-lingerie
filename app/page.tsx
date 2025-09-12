"use client"
import ShaderBackground from "@/components/shader-background"
import { Button } from "@/components/ui/button"
import { LogIn, MessageCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Playfair_Display, Poppins } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    cpf: "",
    telefone: "",
    endereco: {
        rua: "",
        numero: "",
        bairro: "",
        cidade: "",
        uf: "MS",
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name in formData.endereco) {
        setFormData(prev => ({...prev, endereco: {...prev.endereco, [name]: value}}))
    } else {
        setFormData(prev => ({...prev, [name]: value}))
    }
  }

  const showMessage = (msg: string, type: "success" | "error") => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage("")
      setMessageType("")
    }, 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    // Validação simples
    if (formData.cpf.replace(/\D/g, '').length !== 11) {
        showMessage("CPF deve ter exatamente 11 dígitos.", "error")
        setIsLoading(false)
        return
    }
    if (formData.telefone.replace(/\D/g, '').length < 10) {
        showMessage("Telefone deve ter pelo menos 10 dígitos (DDD + número).", "error")
        setIsLoading(false)
        return
    }

    try {
        const response = await fetch('/api/leads/id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Ocorreu um erro no servidor.');
        }

        showMessage(`Sucesso! ${formData.nomeCompleto}, seus dados foram recebidos. Entraremos em contato em breve.`, "success")
        
        // Limpar formulário
        setFormData({
            nomeCompleto: "", cpf: "", telefone: "",
            endereco: { rua: "", numero: "", bairro: "", cidade: "", uf: "MS" }
        })

    } catch (error: any) {
        const errorMessage = error.message === 'CPF já cadastrado' 
            ? 'O CPF informado já está cadastrado em nosso sistema.' 
            : 'Não foi possível concluir seu cadastro. Tente novamente.'
        showMessage(errorMessage, "error")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <ShaderBackground>
      {/* Botão Admin */}
      <div className="absolute top-4 right-4 z-30">
        <Link href="/admin/login">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 text-sm"
          >
            <LogIn className="w-3 h-3 mr-1" />
            Área Administrativa
          </Button>
        </Link>
      </div>

      {/* Mensagem de Feedback */}
      {message && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
          messageType === "success" 
            ? "bg-green-500 text-white" 
            : "bg-red-500 text-white"
        }`}>
          {message}
        </div>
      )}

      {/* Conteúdo principal */}
      <div className={`relative z-20 flex flex-col items-center px-4 py-8 space-y-12 ${poppins.variable} ${playfair.variable} font-sans`}>
        
        {/* Logo + título */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Image 
            src="/logo.png" 
            alt="Segunda Pele Lingerie" 
            width={300} 
            height={300} 
            className="drop-shadow-lg" 
          />
          <h1 
            className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl leading-tight"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Seja uma de nossas consultoras
          </h1>
          <p 
            className="text-lg md:text-xl text-violet-200 italic"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Para você usar, ousar e lucrar!
          </p>
        </div>

        {/* Banner + Cadastro */}
        <section className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          
          {/* Banner */}
          <div className="relative w-full h-[500px] lg:h-auto mx-auto rounded-2xl overflow-hidden border border-white/20 shadow-xl">
            <Image 
              src="/imagem1.jpeg" 
              alt="Coleção Segunda Pele" 
              fill 
              className="object-cover" 
              priority 
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-4 right-4 text-center">
              <h2 
                className="text-white text-xl md:text-2xl font-bold drop-shadow-lg"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Sofisticação que se sente na pele
              </h2>
              <p 
                className="text-violet-100 text-base md:text-lg drop-shadow-md"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Segunda Pele Lingerie — Para você usar, ousar e lucrar!
              </p>
            </div>
          </div>

          {/* Formulário */}
          <form 
            onSubmit={handleSubmit} 
            className="w-full mx-auto p-6 md:p-8 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg flex flex-col justify-center"
          >
            <h2 
              className="text-2xl md:text-3xl font-semibold text-center text-white mb-6"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Faça agora mesmo seu cadastro
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} placeholder="Nome completo" required className="md:col-span-2 p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <input name="cpf" value={formData.cpf} onChange={handleChange} placeholder="CPF" maxLength={14} required className="p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <input name="telefone" value={formData.telefone} onChange={handleChange} placeholder="Telefone com DDD" maxLength={15} required className="p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <input name="rua" value={formData.endereco.rua} onChange={handleChange} placeholder="Rua" required className="md:col-span-2 p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <input name="numero" value={formData.endereco.numero} onChange={handleChange} placeholder="Número" required className="p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <input name="bairro" value={formData.endereco.bairro} onChange={handleChange} placeholder="Bairro" required className="p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <input name="cidade" value={formData.endereco.cidade} onChange={handleChange} placeholder="Cidade" required className="p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6 bg-violet-500 hover:bg-violet-600 text-white font-semibold py-3 rounded-lg text-lg shadow-md"
              disabled={isLoading}
            >
              {isLoading ? <><Loader2 className="w-6 h-6 animate-spin mr-2" /> Enviando...</> : "Concluir cadastro"}
            </Button>
          </form>
        </section>

        {/* Frase abaixo do formulário */}
        <section className="max-w-3xl w-full text-center mt-8">
          <h3 
            className="text-2xl md:text-3xl font-medium text-white opacity-90"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            A maior empresa de lingerie do estado de Mato Grosso do Sul
          </h3>
        </section>

        {/* Benefícios */}
        <section className="max-w-4xl w-full text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[
              "Comissão de até 40%",
              "Produtos totalmente em consignação",
              "Prazo de 45 dias para pagar",
              "Pague somente o que vender",
            ].map((benefit, i) => (
              <div 
                key={i}
                className="p-4 rounded-lg bg-violet-900/40 border border-violet-400 text-white text-base text-center shadow-md"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                {benefit}
              </div>
            ))}
          </div>
        </section>

        {/* Rodapé */}
        <footer className="flex flex-col items-center text-white text-sm opacity-90 space-y-3 mt-10">
          <Image 
            src="/logo2.png" 
            alt="Segunda Pele Lingerie" 
            width={150} 
            height={150} 
          />
          <p 
            className="italic text-lg"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Para você usar, ousar e lucrar!
          </p>
          <div className="mt-2">
            <Link 
              href="https://www.instagram.com/segundapelemslingerie?igsh=MTMxZGJmczBsdGNraA%3D%3D&utm_source=qr" 
              target="_blank"
              className="px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-md transition text-sm"
            >
              Instagram
            </Link>
          </div>
        </footer>
      </div>

      {/* Botão WhatsApp fixo */}
      <Link 
        href="https://api.whatsapp.com/send?phone=5567992149878&text=Olá%20gostaria%20de%20fazer%20o%20meu%20cadastro!%20" 
        target="_blank"
        className="fixed bottom-4 right-4 z-50 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full shadow-lg animate-pulse"
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </Link>
    </ShaderBackground>
  )
}