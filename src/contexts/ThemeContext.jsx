import React, { createContext, useState, useEffect } from 'react';

export const themes = {
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    bg: 'bg-slate-950',
    glassPanel: 'bg-slate-900/40 backdrop-blur-xl border-slate-700/50',
    accent: 'from-cyan-400 to-blue-500',
    accentText: 'text-cyan-400',
    button: 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:shadow-cyan-500/25',
    border: 'border-cyan-500/30',
    shadow: 'shadow-cyan-500/20',
    orb1: 'from-cyan-400/20 to-blue-500/20',
    orb2: 'from-blue-400/20 to-cyan-500/20',
    iconBg: 'bg-gradient-to-br from-cyan-400 to-blue-500',
    inputBg: 'bg-slate-800/50 focus:border-cyan-400/50',
    text: 'text-slate-100',
    textMuted: 'text-slate-400'
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    bg: 'bg-stone-950',
    glassPanel: 'bg-stone-900/40 backdrop-blur-xl border-stone-700/50',
    accent: 'from-orange-400 to-rose-500',
    accentText: 'text-orange-400',
    button: 'bg-gradient-to-r from-orange-400 to-rose-500 hover:shadow-orange-500/25',
    border: 'border-orange-500/30',
    shadow: 'shadow-orange-500/20',
    orb1: 'from-orange-400/20 to-rose-500/20',
    orb2: 'from-rose-400/20 to-orange-500/20',
    iconBg: 'bg-gradient-to-br from-orange-400 to-rose-500',
    inputBg: 'bg-stone-800/50 focus:border-orange-400/50',
    text: 'text-stone-100',
    textMuted: 'text-stone-400'
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    bg: 'bg-green-950',
    glassPanel: 'bg-green-900/40 backdrop-blur-xl border-green-700/50',
    accent: 'from-emerald-400 to-green-600',
    accentText: 'text-emerald-400',
    button: 'bg-gradient-to-r from-emerald-400 to-green-600 hover:shadow-emerald-500/25',
    border: 'border-emerald-500/30',
    shadow: 'shadow-emerald-500/20',
    orb1: 'from-emerald-400/20 to-green-500/20',
    orb2: 'from-green-400/20 to-emerald-500/20',
    iconBg: 'bg-gradient-to-br from-emerald-400 to-green-600',
    inputBg: 'bg-green-800/50 focus:border-emerald-400/50',
    text: 'text-green-50',
    textMuted: 'text-green-300/70'
  },
  nebula: {
    id: 'nebula',
    name: 'Nebula',
    bg: 'bg-indigo-950',
    glassPanel: 'bg-indigo-900/40 backdrop-blur-xl border-indigo-700/50',
    accent: 'from-violet-400 to-fuchsia-500',
    accentText: 'text-violet-400',
    button: 'bg-gradient-to-r from-violet-400 to-fuchsia-500 hover:shadow-violet-500/25',
    border: 'border-violet-500/30',
    shadow: 'shadow-violet-500/20',
    orb1: 'from-violet-400/20 to-fuchsia-500/20',
    orb2: 'from-fuchsia-400/20 to-violet-500/20',
    iconBg: 'bg-gradient-to-br from-violet-400 to-fuchsia-500',
    inputBg: 'bg-indigo-800/50 focus:border-violet-400/50',
    text: 'text-indigo-50',
    textMuted: 'text-indigo-300/70'
  }
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(localStorage.getItem('themeId') || 'ocean');
  
  const currentTheme = themes[themeId] || themes.ocean;

  useEffect(() => {
    localStorage.setItem('themeId', themeId);
    // Optional: Update body class or data attribute if needed for global styles
    document.body.className = currentTheme.bg;
  }, [themeId, currentTheme]);

  const switchTheme = (id) => {
    if (themes[id]) {
      setThemeId(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, switchTheme, themes, currentThemeId: themeId }}>
      {children}
    </ThemeContext.Provider>
  );
};
