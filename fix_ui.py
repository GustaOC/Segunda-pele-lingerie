import re

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    content = f.read()

old_ui = """                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm border-white/50 focus:ring-purple-500 focus:border-purple-500 rounded-2xl shadow-lg">
                                <Calendar className="w-4 h-4 mr-2" style={{ color: "#5D3A5B" }} />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                            </SelectContent>
                        </Select>"""

new_ui = """                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-[240px] justify-start text-left font-normal bg-white/80 backdrop-blur-sm border-white/50 focus:ring-purple-500 focus:border-purple-500 rounded-2xl shadow-lg"
                                >
                                    <Calendar className="mr-2 h-4 w-4" style={{ color: "#5D3A5B" }} />
                                    {startDate ? (
                                        `${format(startDate, 'dd/MM/yyyy')} - ${format(addDays(startDate, 6), 'dd/MM/yyyy')}`
                                    ) : (
                                        <span>Selecione uma data</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-white/50 shadow-2xl bg-white/95 backdrop-blur-lg" align="start">
                                <CalendarUI
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(date) => date && setStartDate(date)}
                                    initialFocus
                                    className="p-3"
                                />
                                <div className="p-3 border-t text-xs text-slate-500 text-center">
                                    O sistema selecionará automaticamente a semana (7 dias) a partir da data escolhida.
                                </div>
                            </PopoverContent>
                        </Popover>"""

content = content.replace(old_ui, new_ui)

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "w") as f:
    f.write(content)

print("Applied UI patch")
