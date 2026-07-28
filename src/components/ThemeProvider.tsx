"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "light",
    resolvedTheme: "light",
    setTheme: () => {},
});

export function useTheme() {
    return useContext(ThemeContext);
}

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("light");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

    // Sync from localStorage on first mount
    useEffect(() => {
        const saved = (localStorage.getItem("theme") as Theme) ?? "light";
        setThemeState(saved);
        setResolvedTheme(applyTheme(saved));
    }, []);

    // React to system preference changes when theme === "system"
    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => setResolvedTheme(applyTheme("system"));
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        setResolvedTheme(applyTheme(t));
        if (t === "system") {
            localStorage.removeItem("theme");
        } else {
            localStorage.setItem("theme", t);
        }
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
