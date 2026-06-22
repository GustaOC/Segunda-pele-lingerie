"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ShaderBackground from "@/components/shader-background"
import { LogIn, MessageCircle, Loader2, PartyPopper, Instagram, Star, CheckCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Playfair_Display, Inter } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
})

// Tipos para os dados do IBGE
type UF = { id: number; sigla: string; nome: string };
type City = { id: number; nome: string };

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
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

  const [ufs, setUfs] = useState<UF[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedUf, setSelectedUf] = useState("MS");

  // Busca os estados (UFs) na API do IBGE
  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json())
      .then(setUfs);
  }, []);

  // Busca as cidades baseadas no estado selecionado
  useEffect(() => {
    if (selectedUf) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
        .then((res) => res.json())
        .then(setCities);
    }
  }, [selectedUf]);

  // Formata os inputs enquanto o usuário digita
  const formatInput = (name: string, value: string) => {
    if (name === 'cpf') {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .slice(0, 14);
    }
    if (name === 'telefone') {
      return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    }
    return value;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatInput(name, value);

    if (name === "uf") {
      setSelectedUf(value);
      setFormData(prev => ({...prev, endereco: {...prev.endereco, uf: value, cidade: ""}}));
    } else if (Object.keys(formData.endereco).includes(name)) {
        setFormData(prev => ({...prev, endereco: {...prev.endereco, [name]: formattedValue}}))
    } else {
        setFormData(prev => ({...prev, [name]: formattedValue}))
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

    // Validação
    if (formData.cpf.replace(/\D/g, '').length !== 11) {
        showMessage("CPF inválido. Deve conter 11 dígitos.", "error")
        setIsLoading(false)
        return
    }
    const phoneLength = formData.telefone.replace(/\D/g, '').length;
    if (phoneLength < 10 || phoneLength > 11) {
        showMessage("Telefone inválido. Deve ter 10 ou 11 dígitos (DDD + número).", "error")
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

        setShowSuccessModal(true);
        
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full blur-3xl"></div>
      </div>

      {/* Botão Admin */}
      <div className="absolute top-6 right-6 z-30">
        <Link href="/admin/login">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/80 backdrop-blur-md border-purple-200/50 text-slate-700 hover:bg-white hover:border-purple-300 text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <LogIn className="w-3 h-3 mr-2" />
            Área Administrativa
          </Button>
        </Link>
      </div>

      {/* Mensagem de Erro */}
      {message && messageType === 'error' && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl bg-gradient-to-r from-red-500 to-red-600 text-white backdrop-blur-sm border border-red-400/20">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-3 animate-pulse"></div>
            {message}
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className={`relative z-20 flex flex-col items-center px-6 py-12 space-y-16 ${inter.variable} ${playfair.variable} font-sans`}>
        
        {/* Cabeçalho */}
        <div className="flex flex-col items-center text-center space-y-8 mt-12">
          <div className="relative group">
            <Image 
              src="/logoinicial.png" 
              alt="Segunda Pele Lingerie" 
              width={320} 
              height={140} 
              className="drop-shadow-2xl group-hover:scale-105 transition-transform duration-500" 
            />
          </div>
          
          <div className="space-y-6">
            <h1 
              className="text-5xl md:text-7xl font-bold text-slate-800 leading-tight px-4"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Seja uma de nossas consultoras
            </h1>
            <div className="flex justify-center">
              <p 
                className="text-xl md:text-2xl font-medium max-w-2xl text-center"
                style={{ fontFamily: "var(--font-inter)", color: "#5D3A5B" }}
              >
                Para você usar, ousar e lucrar!
              </p>
            </div>
          </div>
        </div>

        {/* Banner + Cadastro */}
        <section className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
          
          {/* Banner */}
          <div className="relative w-full h-[600px] lg:h-auto mx-auto rounded-3xl overflow-hidden shadow-2xl group">
            <Image 
              src="imagem0.jpeg" 
              alt="Coleção Segunda Pele" 
              fill 
              className="object-contain group-hover:scale-110 transition-transform duration-700" 
              priority 
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            
            <div className="absolute bottom-8 left-8 right-8 text-left space-y-4">
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400 mr-1 animate-pulse" style={{animationDelay: `${i * 0.1}s`}} />
                ))}
              </div>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold drop-shadow-2xl mb-3"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Sofisticação que se sente na pele
              </h2>
              <p 
                className="text-white/90 text-lg md:text-xl drop-shadow-lg font-medium"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Segunda Pele Lingerie — Para você usar, ousar e lucrar!
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="w-full mx-auto p-10 rounded-3xl bg-white/70 backdrop-blur-lg shadow-2xl border border-white/20 flex flex-col justify-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-3xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-bl-3xl"></div>
            
            <div className="relative z-10">
              <h2 
                className="text-3xl md:text-4xl font-bold text-center text-slate-800 mb-3"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Faça agora mesmo seu cadastro
              </h2>
              <p className="text-center text-slate-600 mb-8 font-medium">Junte-se à nossa equipe de consultoras</p>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input 
                    name="nomeCompleto" 
                    value={formData.nomeCompleto} 
                    onChange={handleChange} 
                    placeholder="Nome completo" 
                    required 
                    className="md:col-span-2 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-white" 
                  />
                  <input 
                    name="cpf" 
                    value={formData.cpf} 
                    onChange={handleChange} 
                    placeholder="CPF" 
                    required 
                    className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-white" 
                  />
                  <input 
                    name="telefone" 
                    value={formData.telefone} 
                    onChange={handleChange} 
                    placeholder="Telefone com DDD" 
                    required 
                    className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-white" 
                  />
                  <input 
                    name="rua" 
                    value={formData.endereco.rua} 
                    onChange={handleChange} 
                    placeholder="Rua" 
                    required 
                    className="md:col-span-2 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-white" 
                  />
                  <input 
                    name="numero" 
                    value={formData.endereco.numero} 
                    onChange={handleChange} 
                    placeholder="Número" 
                    required 
                    className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-white" 
                  />
                  <input 
                    name="bairro" 
                    value={formData.endereco.bairro} 
                    onChange={handleChange} 
                    placeholder="Bairro" 
                    required 
                    className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-white" 
                  />
                  
                  <div className="relative">
                    <input
                      name="cidade"
                      value={formData.endereco.cidade}
                      onChange={handleChange}
                      placeholder="Cidade"
                      required
                      list="cities-list"
                      className="w-full p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-white"
                    />
                    <datalist id="cities-list">
                      {cities.map((city) => (
                        <option key={city.id} value={city.nome} />
                      ))}
                    </datalist>
                  </div>

                  <select
                    name="uf"
                    value={selectedUf}
                    onChange={handleChange}
                    required
                    className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 appearance-none shadow-lg hover:shadow-xl transition-all duration-300 focus:bg-white"
                  >
                    <option value="" disabled>UF</option>
                    {ufs.map((uf) => (
                      <option key={uf.id} value={uf.sigla}>
                        {uf.sigla}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-8 text-white font-semibold py-4 rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-purple-500/20"
                  style={{ 
                    background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)",
                    hover: { background: "linear-gradient(to right, #4A2E49, #3B2338, #2C1B29)" }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin mr-3" /> 
                      Enviando...
                    </>
                  ) : (
                    <>
                      Concluir cadastro
                      <Sparkles className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Frase de destaque */}
        <section className="max-w-5xl w-full text-center mt-16 px-6">
          <h3 
            className="text-3xl md:text-4xl font-bold text-slate-800 mb-8"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            A maior empresa de lingerie do estado de <br />
            <span style={{ color: "#5D3A5B" }}>Mato Grosso do Sul</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {[
              { text: "Comissão de até 40%" },
              { text: "Produtos totalmente em consignação" },
              { text: "Prazo de 45 dias para pagar" },
              { text: "Pague somente o que vender" },
            ].map((benefit, i) => (
              <div 
                key={i}
                className="group p-8 rounded-3xl bg-white/60 backdrop-blur-lg border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-white/80 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                <div className="relative z-10 flex items-center justify-center flex-col space-y-4">
                  <CheckCircle className="w-8 h-8 transition-colors duration-300" style={{ color: "#5D3A5B" }} />
                  <p 
                    className="text-slate-700 text-lg font-medium text-center leading-relaxed"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {benefit.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rodapé */}
        <footer className="flex flex-col items-center text-slate-700 space-y-8 mt-20 pb-12 px-6">
          <div className="relative group">
            <Image 
              src="/logodebaixo.png" 
              alt="Segunda Pele Lingerie" 
              width={180} 
              height={180}
              className="group-hover:scale-110 transition-transform duration-500" 
            />
          </div>
          
          <p 
            className="text-xl font-medium"
            style={{ fontFamily: "var(--font-playfair)", color: "#5D3A5B" }}
          >
            Para você usar, ousar e lucrar!
          </p>
          
          <div className="mt-4">
            <Link 
              href="https://www.instagram.com/segundapelemslingerie?igsh=MTMxZGJmczBsdGNraA%3D%3D&utm_source=qr" 
              target="_blank"
              className="group px-8 py-4 rounded-full text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center text-base hover:scale-105 border border-purple-500/20"
              style={{ 
                background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)"
              }}
            >
              <Instagram className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
              Siga-nos no Instagram
              <Sparkles className="w-4 h-4 ml-2 group-hover:animate-pulse" />
            </Link>
          </div>
          
          <p className="text-sm text-slate-500 text-center mt-8 font-medium">
            © {new Date().getFullYear()} Segunda Pele Lingerie. Todos os direitos reservados.
          </p>
        </footer>
      </div>

      {/* Botão WhatsApp fixo */}
      <Link 
        href="https://api.whatsapp.com/send?phone=5567992149878&text=Olá%20gostaria%20de%20fazer%20o%20meu%20cadastro!%20" 
        target="_blank"
        className="fixed bottom-8 right-8 z-50 group flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white w-16 h-16 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border border-green-400/20"
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle className="w-7 h-7 group-hover:animate-bounce" />
        <div className="absolute -inset-1 bg-green-400/30 rounded-2xl blur-lg animate-pulse"></div>
      </Link>

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-lg border-purple-200/50 text-slate-800 rounded-3xl shadow-2xl">
          <DialogHeader>
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                  <PartyPopper className="w-10 h-10" style={{ color: "#5D3A5B" }} />
                </div>
              </div>
            </div>
            <DialogTitle 
              className="text-3xl text-center font-bold text-slate-800 mb-4" 
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Cadastro Concluído com Sucesso! 
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center space-y-6 text-slate-600">
            <p className="text-xl font-semibold" style={{ color: "#5D3A5B" }}>Bem-vinda à família Segunda Pele Lingerie 💕</p>
            <p className="text-base leading-relaxed">
              Agora você faz parte de um time de consultoras que valorizam beleza, confiança e independência.
            </p>
            <p className="text-base leading-relaxed">
              Em breve, caso seu cadastro seja aprovado, um de nossos representantes entrará em contato para compartilhar todas as informações e ajudar você a iniciar essa nova jornada.
            </p>
            <p className="text-base leading-relaxed">
              Enquanto isso, siga nossas redes sociais e fique por dentro das novidades!
            </p>
            <div className="py-4">
              <p className="text-lg font-bold italic" style={{ color: "#5D3A5B" }}>
                Estamos muito felizes em ter você conosco!
              </p>
            </div>
            <p className="text-sm text-slate-500 pt-4 border-t border-slate-200">
              Segunda Pele Lingerie – para você usar, ousar e lucrar!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}