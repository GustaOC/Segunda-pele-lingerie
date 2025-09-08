"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Heart, MessageCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ConsultantRegistration() {
  const [formData, setFormData] = useState({
    fullName: "",
    cpf: "",
    phone: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    cep: "",
    state: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, "")
    if (cleanCPF.length !== 11) return false

    // Check for repeated digits
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false

    // Validate check digits
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += Number.parseInt(cleanCPF[i]) * (10 - i)
    }
    let digit1 = 11 - (sum % 11)
    if (digit1 > 9) digit1 = 0

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += Number.parseInt(cleanCPF[i]) * (11 - i)
    }
    let digit2 = 11 - (sum % 11)
    if (digit2 > 9) digit2 = 0

    return digit1 === Number.parseInt(cleanCPF[9]) && digit2 === Number.parseInt(cleanCPF[10])
  }

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, "")
    return cleanValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, "")
    return cleanValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4,5})(\d{4})/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1")
  }

  const formatCEP = (value: string) => {
    const cleanValue = value.replace(/\D/g, "")
    return cleanValue.replace(/(\d{5})(\d)/, "$1-$2").replace(/(-\d{3})\d+?$/, "$1")
  }

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value

    if (field === "cpf") {
      formattedValue = formatCPF(value)
    } else if (field === "phone") {
      formattedValue = formatPhone(value)
    } else if (field === "cep") {
      formattedValue = formatCEP(value)
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName || formData.fullName.split(" ").length < 2) {
      newErrors.fullName = "Nome completo deve ter pelo menos 2 palavras"
    }

    if (!validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido"
    }

    if (!formData.phone || formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Telefone deve ter pelo menos 10 dígitos"
    }

    if (!formData.cep || formData.cep.replace(/\D/g, "").length !== 8) {
      newErrors.cep = "CEP deve ter 8 dígitos"
    }

    const requiredFields = ["street", "number", "neighborhood", "city", "state"]
    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = "Campo obrigatório"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setIsSubmitted(true)
      // Here you would typically send the data to your backend
      console.log("Form submitted:", formData)
    }
  }

  const handleWhatsAppContact = () => {
    const message = "Olá! Gostaria de mais informações sobre como ser consultora Segunda Pele Lingerie."
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Cadastro Realizado!</h2>
            <p className="text-muted-foreground mb-6">
              Obrigada pelo seu interesse! Em breve entraremos em contato para dar continuidade ao seu processo.
            </p>
            <div className="space-y-2">
              <Button onClick={() => setIsSubmitted(false)} variant="outline" className="w-full">
                Fazer Novo Cadastro
              </Button>
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Segunda Pele Lingerie</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Início
                </Button>
              </Link>
              <Button onClick={handleWhatsAppContact} variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Fale Conosco
              </Button>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}
