"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

import { US_CITIES } from "@/lib/us-cities"

interface CityComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CityCombobox({
  value,
  onChange,
  placeholder = "Search city...",
  className,
  disabled,
}: CityComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const filtered = React.useMemo(() => {
    if (!value.trim()) return US_CITIES.slice(0, 80)
    const q = value.toLowerCase()
    return US_CITIES.filter((city) => city.toLowerCase().includes(q)).slice(0, 80)
  }, [value])

  const handleSelect = (city: string) => {
    onChange(city)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("pr-10", className)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen(!open)}
          >
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>No cities found. Type to add a custom city.</CommandEmpty>
            <CommandGroup>
              {filtered.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => handleSelect(city)}
                >
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
