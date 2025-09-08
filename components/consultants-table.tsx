//components/consultants-table.tsx
"use client";

import useSWR from "swr";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Consultant = {
  id: string;
  nome: string;
  cidade: string;
  createdAt: string;
  status: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ConsultantsTable() {
  const { data, error, isLoading } = useSWR<Consultant[]>("/api/leads", fetcher);

  if (isLoading) return <p className="text-center text-gray-400">Carregando...</p>;
  if (error) return <p className="text-center text-red-500">Erro ao carregar dados.</p>;
  if (!data || data.length === 0) return <p className="text-center text-gray-500">Nenhum cadastro encontrado.</p>;

  return (
    <div className="mt-12 w-full overflow-x-auto">
      <Table>
        <TableCaption>Lista de consultoras cadastradas</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.nome}</TableCell>
              <TableCell>{c.cidade}</TableCell>
              <TableCell>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
