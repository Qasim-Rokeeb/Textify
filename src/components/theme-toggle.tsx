"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Type, Pilcrow } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "sans" ? "serif" : "sans")}
    >
      <Type className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all serif:rotate-90 serif:scale-0" />
      <Pilcrow className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all serif:rotate-0 serif:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
