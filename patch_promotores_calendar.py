import re

with open("app/admin/(protected)/estoque/promotores/page.tsx", "r") as f:
    content = f.read()

# 1. Imports
if 'import { Popover' not in content:
    content = content.replace(
        'import { Button } from "@/components/ui/button"',
        'import { Button } from "@/components/ui/button"\nimport { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"\nimport { Calendar as CalendarUI } from "@/components/ui/calendar"\nimport { format, addDays } from "date-fns"'
    )

content = content.replace(
    'import { Loader2, Plus, ArrowRight, User, ShoppingCart, Trash2, Package, X } from "lucide-react"',
    'import { Loader2, Plus, ArrowRight, User, ShoppingCart, Trash2, Package, X, Calendar } from "lucide-react"'
)

# 2. State
if 'const [weeklyPeriodDate' not in content:
    content = content.replace(
        'const [weeklyPeriod, setWeeklyPeriod] = useState("")',
        'const [weeklyPeriod, setWeeklyPeriod] = useState("")\n  const [weeklyPeriodDate, setWeeklyPeriodDate] = useState<Date | undefined>(undefined)'
    )

# 3. UI
old_ui = """                <div className="pt-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">2. Período Semanal (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: 12 a 18/fevereiro"
                    value={weeklyPeriod}
                    onChange={(e) => setWeeklyPeriod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                  />
                </div>"""

new_ui = """                <div className="pt-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">2. Período Semanal (Opcional)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-slate-50 border-slate-200 px-4 py-3 h-auto hover:bg-slate-100"
                      >
                        <Calendar className="mr-2 h-4 w-4 text-brand-plum" />
                        {weeklyPeriodDate ? (
                          `${format(weeklyPeriodDate, 'dd/MM/yyyy')} a ${format(addDays(weeklyPeriodDate, 6), 'dd/MM/yyyy')}`
                        ) : (
                          <span className="text-slate-500">Selecione o dia inicial da semana...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-slate-200 shadow-xl" align="start">
                      <CalendarUI
                        mode="single"
                        selected={weeklyPeriodDate}
                        onSelect={(date) => {
                          setWeeklyPeriodDate(date);
                          if (date) {
                            setWeeklyPeriod(`${format(date, 'dd/MM/yyyy')} a ${format(addDays(date, 6), 'dd/MM/yyyy')}`);
                          } else {
                            setWeeklyPeriod("");
                          }
                        }}
                        initialFocus
                        className="p-3"
                      />
                      <div className="p-3 border-t text-xs text-slate-500 text-center bg-slate-50 rounded-b-2xl">
                          O sistema fechará automaticamente a janela de 7 dias.
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>"""

content = content.replace(old_ui, new_ui)

with open("app/admin/(protected)/estoque/promotores/page.tsx", "w") as f:
    f.write(content)

print("Applied calendar patch to estoque/promotores")
