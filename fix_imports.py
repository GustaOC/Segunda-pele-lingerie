import re

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    content = f.read()

if 'import { Calendar as CalendarUI }' not in content:
    content = content.replace(
        'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";',
        'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\nimport { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { Calendar as CalendarUI } from "@/components/ui/calendar";'
    )
    
if 'addDays' not in content:
    content = content.replace(
        'import { format, subDays, startOfMonth, endOfMonth } from "date-fns";',
        'import { format, subDays, startOfMonth, endOfMonth, addDays } from "date-fns";'
    )

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "w") as f:
    f.write(content)

print("Added imports")
