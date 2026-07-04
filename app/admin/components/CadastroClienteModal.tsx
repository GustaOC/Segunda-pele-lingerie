"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClienteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CadastroClienteModal({ open, onOpenChange, onSuccess }: ClienteModalProps) {
  const [hasAccount, setHasAccount] = useState<"sim" | "nao" | null>(null)
  
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Form Fields
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [telefone, setTelefone] = useState("")
  const [endereco, setEndereco] = useState({
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: ""
  })

  const [loading, setLoading] = useState(false)

  // Fetch users for the combobox if "Sim" is selected
  useEffect(() => {
    if (hasAccount === "sim" && users.length === 0) {
      setLoadingUsers(true)
      fetch('/api/admin/user')
        .then(res => res.json())
        .then(data => {
          if (data && data.data) {
            setUsers(data.data)
          }
        })
        .finally(() => {
          setLoadingUsers(false)
        })
    }
  }, [hasAccount, users.length])

  // When a user is selected, pre-fill their name
  useEffect(() => {
    if (selectedUser) {
      const u = users.find(x => x.id === selectedUser)
      if (u) {
        setNome(u.nome || u.email || "")
        // Attempt to extract metadata if we have it? The /api/admin/user route doesn't return full metadata, 
        // but we can at least fill the name and let the admin type the rest.
        if (u.telefone) setTelefone(u.telefone)
      }
    }
  }, [selectedUser, users])

  const handleCEPBlur = async () => {
    const cleanCep = endereco.cep.replace(/\D/g, "")
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setEndereco(prev => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            uf: data.uf
          }))
        }
      } catch (e) {}
    }
  }

  const handleSubmit = async () => {
    if (!nome || !cpf || !telefone || !endereco.rua || !endereco.numero || !endereco.bairro || !endereco.cidade || !endereco.uf || !endereco.cep) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: hasAccount === "sim" ? selectedUser : undefined,
          nome,
          cpf,
          telefone,
          endereco
        })
      })

      if (!res.ok) {
        throw new Error("Erro ao salvar cliente")
      }

      onSuccess?.()
      onOpenChange(false)
      // Reset form
      setHasAccount(null)
      setSelectedUser("")
      setNome("")
      setCpf("")
      setTelefone("")
      setEndereco({ rua: "", numero: "", bairro: "", cidade: "", uf: "", cep: "" })
    } catch (e) {
      console.error(e)
      alert("Ocorreu um erro ao salvar o cliente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ fontFamily: "var(--font-playfair)" }}>
            Cadastro de Cliente
          </DialogTitle>
          <DialogDescription>
            Registre um novo cliente no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="font-semibold text-slate-800">Este cliente já possui cadastro/login no E-commerce? (Ex: Conta Google)</Label>
            <RadioGroup
              value={hasAccount || ""}
              onValueChange={(val) => setHasAccount(val as "sim" | "nao")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="sim" />
                <Label htmlFor="sim" className="font-normal cursor-pointer">Sim, já possui</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="nao" />
                <Label htmlFor="nao" className="font-normal cursor-pointer">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {hasAccount === "sim" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label>Pesquisar Cliente / E-mail</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between"
                  >
                    {selectedUser
                      ? (users.find((u) => u.id === selectedUser)?.nome || users.find((u) => u.id === selectedUser)?.email)
                      : loadingUsers ? "Carregando..." : "Pesquise pelo nome ou email..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[550px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Digite o nome ou e-mail..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {users.map((u) => (
                          <CommandItem
                            key={u.id}
                            value={`${u.nome} ${u.email} ${u.id}`}
                            onSelect={() => {
                              setSelectedUser(u.id)
                              setComboboxOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUser === u.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{u.nome || "Sem nome"}</span>
                              <span className="text-xs text-slate-500">{u.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {(hasAccount === "nao" || (hasAccount === "sim" && selectedUser)) && (
            <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João da Silva" />
                </div>
                <div className="space-y-2">
                  <Label>CPF *</Label>
                  <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp *</Label>
                  <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                
                <div className="space-y-2">
                  <Label>CEP *</Label>
                  <Input value={endereco.cep} onChange={(e) => setEndereco({...endereco, cep: e.target.value})} onBlur={handleCEPBlur} placeholder="00000-000" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Endereço / Rua *</Label>
                  <Input value={endereco.rua} onChange={(e) => setEndereco({...endereco, rua: e.target.value})} placeholder="Rua das Flores" />
                </div>
                <div className="space-y-2">
                  <Label>Número *</Label>
                  <Input value={endereco.numero} onChange={(e) => setEndereco({...endereco, numero: e.target.value})} placeholder="123" />
                </div>
                <div className="space-y-2">
                  <Label>Bairro *</Label>
                  <Input value={endereco.bairro} onChange={(e) => setEndereco({...endereco, bairro: e.target.value})} placeholder="Centro" />
                </div>
                <div className="space-y-2">
                  <Label>Cidade *</Label>
                  <Input value={endereco.cidade} onChange={(e) => setEndereco({...endereco, cidade: e.target.value})} placeholder="São Paulo" />
                </div>
                <div className="space-y-2">
                  <Label>UF *</Label>
                  <Input value={endereco.uf} onChange={(e) => setEndereco({...endereco, uf: e.target.value})} placeholder="SP" maxLength={2} />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            className="bg-brand-plum hover:bg-brand-plum/90" 
            onClick={handleSubmit} 
            disabled={loading || !hasAccount || (hasAccount === "sim" && !selectedUser)}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar Cadastro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
