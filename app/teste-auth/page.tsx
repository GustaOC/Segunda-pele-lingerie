"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuth() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Teste 1: Verificar configuração
  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-auth')
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Erro no teste:', error)
      setTestResults({ error: 'Erro ao executar teste' })
    }
    setLoading(false)
  }

  // Teste 2: Criar/Atualizar admin
  const createAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-auth', {
        method: 'POST',
      })
      const data = await response.json()
      alert(data.message || data.error)
      runTest() // Recarregar resultados
    } catch (error) {
      console.error('Erro ao criar admin:', error)
      alert('Erro ao criar admin')
    }
    setLoading(false)
  }

  useEffect(() => {
    runTest()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">🔍 Diagnóstico de Autenticação</h1>
      
      <div className="space-y-6">
        {/* Botões de Ação */}
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-x-4">
            <Button onClick={runTest} disabled={loading}>
              🔄 Executar Teste
            </Button>
            <Button onClick={createAdmin} disabled={loading} variant="outline">
              ➕ Criar/Atualizar Admin
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        {testResults && (
          <>
            {/* Variáveis de Ambiente */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Variáveis de Ambiente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm">
                  <div>NEXTAUTH_SECRET: {testResults.environment?.hasNextAuthSecret ? '✅' : '❌'}</div>
                  <div>NEXTAUTH_URL: {testResults.environment?.nextAuthUrl || '❌ Não configurado'}</div>
                  <div>SUPABASE_URL: {testResults.environment?.supabaseUrl || '❌ Não configurado'}</div>
                  <div>SUPABASE_ANON_KEY: {testResults.environment?.hasSupabaseAnon ? '✅' : '❌'}</div>
                  <div>SUPABASE_SERVICE_KEY: {testResults.environment?.hasSupabaseService ? '✅' : '❌'}</div>
                </div>
              </CardContent>
            </Card>

            {/* Banco de Dados */}
            <Card>
              <CardHeader>
                <CardTitle>🗄️ Banco de Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Conectado: {testResults.database?.connected ? '✅' : '❌'}</div>
                  <div>Tabela existe: {testResults.database?.tableExists ? '✅' : '❌'}</div>
                  <div>Total de usuários: {testResults.database?.users?.length || 0}</div>
                  {testResults.database?.error && (
                    <div className="text-red-500">Erro: {testResults.database.error}</div>
                  )}
                  
                  {testResults.database?.users && testResults.database.users.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Usuários cadastrados:</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Email</th>
                            <th className="text-left p-2">Nome</th>
                            <th className="text-left p-2">Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testResults.database.users.map((user: any) => (
                            <tr key={user.id} className="border-b">
                              <td className="p-2">{user.email}</td>
                              <td className="p-2">{user.nome}</td>
                              <td className="p-2">{user.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Teste de Login */}
            <Card>
              <CardHeader>
                <CardTitle>🔐 Teste de Login (admin@segundapele.com)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>Usuário encontrado: {testResults.testLogin?.userFound ? '✅' : '❌'}</div>
                  <div>Senha correta: {testResults.testLogin?.passwordMatch ? '✅' : '❌'}</div>
                  {testResults.testLogin?.error && (
                    <div className="text-red-500">Erro: {testResults.testLogin.error}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}