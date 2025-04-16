import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FormControl } from "@/components/ui/form"

interface DatePickerProps {
  date?: Date | undefined;
  setDate?: (date: Date | undefined) => void;
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
}

export function DatePicker({ 
  date, 
  setDate, 
  value, 
  onChange, 
  disabled 
}: DatePickerProps) {
  // Support both old and new prop patterns
  const selectedDate = value || date;
  const handleDateChange = onChange || setDate;
  const [open, setOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    handleDateChange?.(date);
    setOpen(false); // Close the popover after selection
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          defaultMonth={selectedDate}
        />
      </PopoverContent>
    </Popover>
  )
}
