"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    role: "ADMIN"
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setMessage(`✅ Usuário criado com sucesso! Email: ${formData.email}`)
        setFormData({
          nome: "",
          email: "",
          password: "",
          role: "ADMIN"
        })
      } else {
        setSuccess(false)
        setMessage(`❌ Erro: ${data.error}`)
      }
    } catch (error) {
      setSuccess(false)
      setMessage("❌ Erro ao conectar com servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Registrar Primeiro Admin
          </CardTitle>
          <p className="text-center text-gray-600">
            ⚠️ Esta página é temporária - delete após criar o admin
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <Input
                id="nome"
                name="nome"
                type="text"
                required
                value={formData.nome}
                onChange={handleChange}
                placeholder="Digite seu nome"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@admin.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha (mínimo 8 caracteres)
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Digite uma senha segura"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Cargo
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="TRIAGEM">TRIAGEM</option>
                <option value="PROMOTOR">PROMOTOR</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Criando..." : "Criar Usuário Admin"}
            </Button>
          </form>

          {message && (
            <Alert className={`mt-4 ${success ? 'border-green-500' : 'border-red-500'}`}>
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <strong>Agora você pode:</strong>
              </p>
              <ol className="list-decimal list-inside text-sm text-green-700 mt-2">
                <li>Ir para <a href="/admin/login" className="underline font-medium">/admin/login</a></li>
                <li>Fazer login com o email e senha criados</li>
                <li>Deletar esta página de registro</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}