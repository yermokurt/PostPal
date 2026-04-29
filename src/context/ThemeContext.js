import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Force Light Mode for the new redesign
        setTheme('light');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);

    function toggleTheme() {
        // Disable theme toggle for this design
        console.log("Theme toggle disabled for this design.");
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
