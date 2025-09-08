"use client"

import ShaderBackground from "@/components/shader-background"
import { Button } from "@/components/ui/button"
import { LogIn, MessageCircle } from "lucide-react"
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
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "cpf" || name === "telefone") {
      if (!/^\d*$/.test(value)) return
    }
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.cpf.length !== 11) {
      alert("CPF deve ter exatamente 11 dígitos")
      return
    }
    if (formData.telefone.length !== 11) {
      alert("Telefone deve ter exatamente 11 dígitos (DDD + número)")
      return
    }
    alert("Cadastro enviado com sucesso!")
  }

  return (
    <ShaderBackground>
      {/* Botão Admin */}
      <div className="absolute top-8 right-8 z-30">
        <Link href="/admin/login">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Área Administrativa
          </Button>
        </Link>
      </div>

      {/* Conteúdo principal */}
      <div
        className={`relative z-20 flex flex-col items-center px-4 py-12 space-y-16 ${poppins.variable} ${playfair.variable} font-sans`}
      >
        {/* Logo + título */}
        <div className="flex flex-col items-center text-center space-y-6">
          <Image
            src="/logo.png"
            alt="Segunda Pele Lingerie"
            width={500}
            height={500}
            className="drop-shadow-lg"
          />
          <h1
            className="text-9xl md:text-10xl font-bold text-white drop-shadow-2xl leading-tight mt-8"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Seja uma de nossas consultoras
          </h1>
          <p
            className="text-xl md:text-2xl text-violet-200 italic"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Para você usar, ousar e lucrar !
          </p>
        </div>

        {/* Banner + Cadastro */}
        <section className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-28 items-start">
          {/* Banner */}
          <div className="relative w-[650px] h-[1000px] mx-auto rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            <Image
              src="/imagem1.jpeg"
              alt="Coleção Segunda Pele"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-10 left-6 right-6 text-center">
              <h2
                className="text-white text-2xl md:text-3xl font-bold drop-shadow-lg"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Sofisticação que se sente na pele
              </h2>
              <p
                className="text-violet-100 text-lg md:text-xl drop-shadow-md"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Segunda Pele Lingerie — Para você usar, ousar e lucrar!
              </p>
            </div>
          </div>

          {/* Formulário */}
          <form
            onSubmit={handleSubmit}
            className="w-[650px] h-[1000px] mx-auto p-14 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl flex flex-col justify-center"
          >
            <h2
              className="text-5xl font-semibold text-center text-white mb-12"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Faça agora mesmo seu cadastro
            </h2>

            <div className="grid grid-cols-2 gap-8">
              {[
                { name: "nome", placeholder: "Nome completo", span: "col-span-2" },
                { name: "cpf", placeholder: "CPF" },
                { name: "telefone", placeholder: "Telefone" },
                { name: "rua", placeholder: "Rua", span: "col-span-2" },
                { name: "numero", placeholder: "Número" },
                { name: "bairro", placeholder: "Bairro" },
                { name: "cidade", placeholder: "Cidade", span: "col-span-2" },
              ].map((field, i) => (
                <input
                  key={i}
                  type="text"
                  name={field.name}
                  value={(formData as any)[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  maxLength={
                    field.name === "cpf" ? 11 : field.name === "telefone" ? 11 : undefined
                  }
                  required
                  className={`${field.span ?? ""} p-6 rounded-lg bg-violet-900/40 border border-violet-400 text-white text-xl placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-300`}
                  style={{ fontFamily: "var(--font-poppins)" }}
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full mt-12 bg-violet-500 hover:bg-violet-600 text-white font-semibold py-6 rounded-xl text-2xl shadow-lg"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Concluir cadastro
            </Button>
          </form>
        </section>

        {/* Frase abaixo do formulário */}
        <section className="max-w-4xl w-full text-center mt-12">
          <h3
            className="text-4xl md:text-5xl font-medium text-white opacity-90"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            A maior empresa de lingerie do estado de Mato Grosso do Sul
          </h3>
        </section>

        {/* Benefícios */}
        <section className="max-w-6xl w-full text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            {[
              "Comissão de até 40%",
              "Produtos totalmente em consignação",
              "Prazo de 45 dias para pagar",
              "Pague somente o que vender",
            ].map((benefit, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-violet-900/40 border border-violet-400 text-white text-2xl text-center shadow-lg"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                {benefit}
              </div>
            ))}
          </div>
        </section>

        {/* Rodapé */}
        <footer className="flex flex-col items-center text-white text-base opacity-90 space-y-4 mt-16">
          <Image
            src="/logo2.png"
            alt="Segunda Pele Lingerie"
            width={220}
            height={220}
          />
          <p
            className="italic text-xl"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Para você usar, ousar e lucrar !
          </p>
          <div className="mt-4">
            <Link
              href="https://www.instagram.com"
              target="_blank"
              className="px-6 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-lg transition"
            >
              Instagram
            </Link>
          </div>
        </footer>
      </div>

      {/* Botão WhatsApp fixo */}
      <Link
        href="https://wa.me/5599999999999"
        target="_blank"
        className="fixed bottom-8 right-8 z-50 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white w-28 h-28 rounded-full shadow-2xl animate-pulse"
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle className="w-14 h-14" />
      </Link>
    </ShaderBackground>
  )
}
