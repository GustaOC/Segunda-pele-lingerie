// lib/prisma.ts
export const prisma = {
  user: {
    findUnique: async () => null,
    create: async () => ({
      id: "mock",
      nome: "Mock User",
      email: "mock@example.com",
      role: "ADMIN",
      ativo: true,
      createdAt: new Date(),
    }),
    findMany: async () => [],
  },
  consultant: {
    findMany: async () => [],
    create: async () => ({
      id: "mock",
      nome: "Mock",
      cpf: "000.000.000-00",
      telefone: "11999999999",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
  lead: {
    findMany: async () => [],
    create: async () => ({
      id: "mock",
      consultantId: "mock",
      status: "EM_ANALISE",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
  event: {
    create: async () => ({
      id: "mock",
      tipo: "mock",
      origem: "mock",
      createdAt: new Date(),
    }),
  },
  $disconnect: async () => {},
} as any
