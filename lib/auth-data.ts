export interface User {
  id: string
  nome: string
  email: string
  hashSenha: string
  role: "ADMIN" | "TRIAGEM" | "PROMOTOR"
  ativo: boolean
  createdAt: Date
}

export interface Consultant {
  id: string
  nome: string
  cpf: string
  telefone: string
  email?: string
  createdAt: Date
  updatedAt: Date
  status?: "EM_ANALISE" | "APROVADO" | "REPROVADO"
  promotorId?: string
  observacoes?: string
}

// In-memory data stores
const users: User[] = [
  {
    id: "1",
    nome: "Administrador",
    email: "admin@segundapele.com",
    hashSenha: "$2b$12$LQv3c1yqBWVHxkd0LQ4YCOdHrADFeKcw6o0e6s2QJOXZM7Wcw5wHm", // password: admin123
    role: "ADMIN",
    ativo: true,
    createdAt: new Date(),
  },
]

const consultants: Consultant[] = [
  {
    id: "1",
    nome: "Maria Silva",
    cpf: "123.456.789-00",
    telefone: "(11) 99999-9999",
    email: "maria@email.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "EM_ANALISE",
  },
  {
    id: "2",
    nome: "Ana Santos",
    cpf: "987.654.321-00",
    telefone: "(11) 88888-8888",
    email: "ana@email.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "APROVADO",
    promotorId: "1",
  },
]

// User operations
export const userOperations = {
  findUnique: async (where: { email: string; ativo?: boolean }) => {
    return (
      users.find((user) => user.email === where.email && (where.ativo === undefined || user.ativo === where.ativo)) ||
      null
    )
  },

  create: async (data: Omit<User, "id" | "createdAt">) => {
    const newUser: User = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    users.push(newUser)
    return newUser
  },

  findMany: async () => users,
}

// Consultant operations
export const consultantOperations = {
  findMany: async () => consultants,

  create: async (data: Omit<Consultant, "id" | "createdAt" | "updatedAt">) => {
    const newConsultant: Consultant = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    consultants.push(newConsultant)
    return newConsultant
  },

  update: async (id: string, data: Partial<Consultant>) => {
    const index = consultants.findIndex((c) => c.id === id)
    if (index !== -1) {
      consultants[index] = { ...consultants[index], ...data, updatedAt: new Date() }
      return consultants[index]
    }
    return null
  },
}

// Event operations (for analytics)
export const eventOperations = {
  create: async (data: { tipo: string; origem: string; meta?: any }) => {
    return {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
    }
  },
}
