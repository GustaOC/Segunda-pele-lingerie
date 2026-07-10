"use client";

import React, { useState, useEffect } from 'react';
import { 
  format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, getWeek 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface AgendaCalendarProps {
  leads: any[];
}

export function AgendaCalendar({ leads }: AgendaCalendarProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Data Fetching State
  const [categories, setCategories] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form State - Event
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventCategoryId, setEventCategoryId] = useState('');

  // Form State - Category
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#3b82f6'); // default blue

  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekNumber = getWeek(currentDate, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Fetch Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catRes, evRes] = await Promise.all([
        fetch('/api/admin/agenda/categories'),
        fetch(`/api/admin/agenda/events?start=${format(startDate, 'yyyy-MM-dd')}&end=${format(endDate, 'yyyy-MM-dd')}`)
      ]);
      const catJson = await catRes.json();
      const evJson = await evRes.json();
      
      if (catJson.data) setCategories(catJson.data);
      if (evJson.data) setEvents(evJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]); // Refetch when week changes

  // Create Category
  const handleCreateCategory = async () => {
    if (!categoryName) return;
    try {
      const res = await fetch('/api/admin/agenda/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName, color: categoryColor })
      });
      if (res.ok) {
        toast({ title: 'Sucesso', description: 'Categoria criada!' });
        setShowCategoryModal(false);
        setCategoryName('');
        fetchData();
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao criar categoria.', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza? Isso apagará a categoria.')) return;
    try {
      const res = await fetch(`/api/admin/agenda/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Sucesso', description: 'Categoria removida!' });
        fetchData();
      }
    } catch (e) {}
  };

  // Create Event
  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate || !eventCategoryId) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/admin/agenda/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: eventTitle, date: eventDate, category_id: eventCategoryId })
      });
      if (res.ok) {
        toast({ title: 'Sucesso', description: 'Marcação adicionada!' });
        setShowEventModal(false);
        setEventTitle('');
        fetchData();
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao criar marcação.', variant: 'destructive' });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar esta marcação?')) return;
    try {
      const res = await fetch(`/api/admin/agenda/events?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Sucesso', description: 'Marcação removida!' });
        fetchData();
      }
    } catch (e) {}
  };

  // Grouping
  const leadsByDay = (day: Date) => leads.filter(l => {
    if (!l.created_at && !l.createdAt) return false;
    return isSameDay(new Date(l.created_at || l.createdAt), day);
  });

  const eventsByDay = (day: Date) => events.filter(e => {
    // A data vem como YYYY-MM-DD
    const [year, month, d] = e.date.split('-');
    const evDate = new Date(Number(year), Number(month) - 1, Number(d));
    return isSameDay(evDate, day);
  });

  return (
    <>
      <Card className="bg-white border shadow-sm rounded-lg overflow-hidden">
        {/* Header (toolbar) */}
        <div className="flex items-center justify-between p-4 border-b bg-slate-50/50 flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="flex rounded-md border shadow-sm">
              <Button variant="ghost" size="icon" onClick={prevWeek} className="h-8 w-8 rounded-none border-r">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextWeek} className="h-8 w-8 rounded-none">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs">Hoje</Button>
          </div>
          
          <div className="text-sm font-medium text-slate-700">
            {format(startDate, "d", { locale: ptBR })} – {format(endDate, "d 'de' MMM 'de' yyyy", { locale: ptBR })}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowCategoryModal(true)} className="h-8 text-xs bg-white text-slate-700">
              <Plus className="h-3 w-3 mr-1" /> Categorias
            </Button>
            <Button size="sm" onClick={() => setShowEventModal(true)} className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-3 w-3 mr-1" /> Nova Marcação
            </Button>
          </div>
        </div>

        {/* Grid Calendário */}
        <div className="flex flex-col relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <span className="text-sm text-slate-500 font-medium">Carregando...</span>
            </div>
          )}

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
            {days.map((day, idx) => {
              const dayLeads = leadsByDay(day);
              const dayEvents = eventsByDay(day);
              const sacoleiras = dayLeads.filter(l => l.status === 'APROVADO' || l.status === 'PENDENTE');
              
              return (
                <div key={idx} className="relative p-2 bg-white flex flex-col gap-2 group hover:bg-slate-50/30 transition-colors border-b">
                  {idx === 0 && (
                     <span className="absolute top-1 left-1 text-[10px] text-slate-400 font-medium">
                       Sm {weekNumber}
                     </span>
                  )}
                  
                  {/* Eventos Customizados */}
                  {dayEvents.map((ev, i) => (
                    <div 
                      key={`ev-${i}`} 
                      className="text-[10px] leading-tight p-1.5 rounded text-white font-medium shadow-sm break-words relative group/ev cursor-pointer"
                      style={{ backgroundColor: ev.agenda_categories?.color || '#3b82f6' }}
                    >
                      {ev.title}
                      <button 
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/ev:opacity-100 transition-opacity"
                        title="Remover marcação"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Leads Automatizados (como os originais verdes) */}
                  {dayLeads.slice(0, 3).map((lead, i) => (
                    <div key={`ld-${i}`} className="text-[10px] leading-tight p-1.5 rounded bg-emerald-500 text-white font-medium shadow-sm break-words">
                      {lead.id?.substring(0, 5)} - {lead.name?.toUpperCase()}
                      {lead.address?.[0]?.city ? `: ${lead.address[0].city.toUpperCase()}` : ''}
                    </div>
                  ))}

                  {/* Resumo Azul (NOVOS CADASTROS) */}
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

      {/* Modal Categoria */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova Categoria</Label>
              <div className="flex gap-2">
                <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Ex: Financeiro" />
                <Input type="color" value={categoryColor} onChange={e => setCategoryColor(e.target.value)} className="w-12 p-1 h-10" />
                <Button onClick={handleCreateCategory}>Criar</Button>
              </div>
            </div>
            
            <div className="mt-6 space-y-2">
              <Label>Categorias Existentes</Label>
              {categories.length === 0 && <p className="text-xs text-slate-500">Nenhuma categoria cadastrada.</p>}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded border bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></div>
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(c.id)} className="h-6 px-2 text-red-500 hover:text-red-700">Remover</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Evento */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Marcação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título / Descrição</Label>
              <Input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Ex: Reunião com Fornecedor" />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={eventCategoryId} onValueChange={setEventCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }}></div>
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                  {categories.length === 0 && (
                    <SelectItem value="empty" disabled>Nenhuma categoria encontrada.</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateEvent} className="bg-purple-600 hover:bg-purple-700 text-white">Salvar Marcação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
