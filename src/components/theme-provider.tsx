
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    // This is a workaround to ensure the class is added to the body tag
    // as ThemeProvider is now wrapping it.
    const body = document.body;
    const currentTheme = localStorage.getItem('theme') || 'system';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const themeToApply = currentTheme === 'system' ? systemTheme : currentTheme;

    body.classList.remove(...(props.themes || []));
    body.classList.add(`theme-${themeToApply}`);
    if (themeToApply === 'dark') {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export function useTheme() {
    const { theme, setTheme, ...rest } = useNextTheme();

    const customSetTheme = (newTheme: string) => {
        const body = document.body;
        const themes = ['light', 'dark', 'minimal', 'ocean', 'forest', 'gradient', 'glass'];

        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const themeToApply = newTheme === 'system' ? systemTheme : newTheme;

        themes.forEach(t => body.classList.remove(`theme-${t}`));
        
        body.classList.add(`theme-${themeToApply}`);
        
        if (themeToApply === 'dark' || (newTheme === 'system' && systemTheme === 'dark')) {
            if(!body.classList.contains('dark')) body.classList.add('dark');
        } else {
            body.classList.remove('dark');
        }

        setTheme(newTheme);
    };

    return { theme, setTheme: customSetTheme, ...rest };
}
