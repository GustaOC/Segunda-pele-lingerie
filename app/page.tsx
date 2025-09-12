"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ShaderBackground from "@/components/shader-background"
import { LogIn, MessageCircle, Loader2, PartyPopper } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
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

// Tipos para os dados do IBGE
type UF = { id: number; sigla: string; nome: string };
type City = { id: number; nome: string };

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [showSuccessModal, setShowSuccessModal] = useState(false) // Novo estado para o modal
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

        setShowSuccessModal(true); // Abre o modal de sucesso
        
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

      {/* Mensagem de Erro (o de sucesso agora é o modal) */}
      {message && messageType === 'error' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg bg-red-500 text-white">
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
          <div className="relative w-full h-[550px] lg:h-auto mx-auto rounded-2xl overflow-hidden border border-white/20 shadow-xl">
            <Image 
              src="https://i.imgur.com/gI895h5.jpeg" 
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
              <input name="cpf" value={formData.cpf} onChange={handleChange} placeholder="CPF" required className="p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <input name="telefone" value={formData.telefone} onChange={handleChange} placeholder="Telefone com DDD" required className="p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <input name="rua" value={formData.endereco.rua} onChange={handleChange} placeholder="Rua" required className="md:col-span-2 p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <input name="numero" value={formData.endereco.numero} onChange={handleChange} placeholder="Número" required className="p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <input name="bairro" value={formData.endereco.bairro} onChange={handleChange} placeholder="Bairro" required className="p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              
              <div className="relative">
                <input
                  name="cidade"
                  value={formData.endereco.cidade}
                  onChange={handleChange}
                  placeholder="Cidade"
                  required
                  list="cities-list"
                  className="w-full p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300"
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
                className="p-3 rounded-lg bg-violet-900/40 border border-violet-400 text-white focus:outline-none focus:ring-2 focus:ring-violet-300 appearance-none"
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

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-lg bg-white/10 backdrop-blur-lg border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
               Cadastro Concluído com Sucesso! 
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center space-y-4">
                        <p className="text-lg">Bem-vinda à família Segunda Pele Lingerie 💕</p>
            <p className="text-sm text-violet-200">
              Agora você faz parte de um time de consultoras que valorizam beleza, confiança e independência.
            </p>
            <p className="text-sm text-violet-200">
               Em breve, caso seu cadastro seja aprovado, um de nossos representantes entrará em contato para compartilhar todas as informações e ajudar você a iniciar essa nova jornada.
            </p>
            <p className="text-sm text-violet-200">
              Enquanto isso, siga nossas redes sociais e fique por dentro das novidades!
            </p>
            <p className="text-md font-semibold text-pink-300 italic mt-4">
               Estamos muito felizes em ter você conosco!
            </p>
            <p className="text-xs text-violet-whith-500">
                Segunda Pele Lingerie – para você usar, ousar e lucrar!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </ShaderBackground>
  )
}