"use client";

import React, { useState } from 'react';
import { 
  format, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay,
  getWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AgendaCalendarProps {
  leads: any[];
}

export function AgendaCalendar({ leads }: AgendaCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekNumber = getWeek(currentDate, { weekStartsOn: 0 });

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Agrupar leads por dia
  const leadsByDay = (day: Date) => {
    return leads.filter((lead) => {
      if (!lead.created_at && !lead.createdAt) return false;
      const leadDate = new Date(lead.created_at || lead.createdAt);
      return isSameDay(leadDate, day);
    });
  };

  return (
    <Card className="bg-white border shadow-sm rounded-lg overflow-hidden">
      {/* Header (toolbar) */}
      <div className="flex items-center justify-between p-4 border-b bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <div className="flex rounded-md border shadow-sm">
            <Button variant="ghost" size="icon" onClick={prevWeek} className="h-8 w-8 rounded-none border-r">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8 rounded-none">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs">
            Hoje
          </Button>
        </div>
        
        <div className="text-sm font-medium text-slate-700">
          {format(startDate, "d", { locale: ptBR })} – {format(endDate, "d 'de' MMM 'de' yyyy", { locale: ptBR })}
        </div>
        
        <div className="flex items-center space-x-1 border rounded-md p-0.5 bg-slate-100">
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-slate-500">Mês</Button>
          <Button variant="secondary" size="sm" className="h-7 text-xs px-2 shadow-sm bg-white text-slate-800">Semana</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-slate-500">Dia</Button>
        </div>
      </div>

      {/* Grid Calendário */}
      <div className="flex flex-col">
        {/* Cabeçalho dos Dias */}
        <div className="grid grid-cols-7 border-b divide-x">
          {days.map((day, idx) => (
            <div key={idx} className="py-2 text-center text-xs text-slate-500 font-medium bg-slate-50/80">
              <span className="capitalize">{format(day, 'E', { locale: ptBR })}</span> {format(day, 'd/M')}
            </div>
          ))}
        </div>

        {/* Células dos Dias */}
        <div className="grid grid-cols-7 divide-x" style={{ minHeight: '60vh' }}>
          {/* Opcional: Coluna extra para mostrar 'Sm 28' ou afins, mas a grid-cols-7 já consome tudo. 
              Pelo layout do print, a semana é um grid direto, mas a primeira coluna tem um 'Sm 28' no canto. 
              Podemos colocar isso dentro do domingo. */}
          
          {days.map((day, idx) => {
            const dayLeads = leadsByDay(day);
            const sacoleiras = dayLeads.filter(l => l.status === 'APROVADO' || l.status === 'PENDENTE');
            // Como exemplo, renderizamos apenas o bloco de NOVAS SACOLEIRAS
            
            return (
              <div key={idx} className="relative p-2 bg-white flex flex-col gap-2 group hover:bg-slate-50/30 transition-colors border-b">
                {idx === 0 && (
                   <span className="absolute top-1 left-1 text-[10px] text-slate-400 font-medium">
                     Sm {weekNumber}
                   </span>
                )}
                
                {/* Renderizar leads individualmente, imitando o verde do print */}
                {dayLeads.slice(0, 3).map((lead, i) => (
                  <div key={i} className="text-[10px] leading-tight p-1.5 rounded bg-emerald-500 text-white font-medium shadow-sm break-words">
                    {lead.id?.substring(0, 5)} - {lead.name?.toUpperCase()}
                    {lead.address?.[0]?.city ? `: ${lead.address[0].city.toUpperCase()}` : ''}
                  </div>
                ))}

                {/* Resumo Azul (NOVAS SACOLEIRAS) */}
                {sacoleiras.length > 0 && (
                  <div className="text-[10px] leading-tight p-1.5 rounded bg-slate-500 text-white font-medium shadow-sm break-words mt-auto">
                    NOVOS CADASTROS: {sacoleiras.length}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
