import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  darkMode: 'class', // Utilise 'class' pour changer de thème par ajout/retrait de la classe 'dark'
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#0EA5E9", // sky-500 en hexadécimal
          "secondary": "#60A5FA", // sky-400 pour une variante
          "accent": "#38BDF8", // sky-300 pour une autre variante
          "neutral": "#E0F2FE", // sky-50 pour une variante plus claire
          "base-100": "#FFFFFF", // Couleur de fond pour le light theme
          "base-200": "#F0F9FF", // sky-50 légèrement modifié
          "base-300": "#E0F2FE", // sky-100 légèrement modifié
          "base-content": "#1E293B", // slate-800 pour le texte sur fond clair
        },
      },
      {
        dark: {
          "primary": "#0EA5E9", // sky-500 en hexadécimal
          "secondary": "#38BDF8", // sky-300 pour une variante
          "accent": "#7DD3FC", // sky-200 pour une autre variante
          "neutral": "#E0F2FE", // sky-50 pour une variante claire
          "base-100": "#0F172A", // slate-950 en hexadécimal
          "base-200": "#1E293B", // slate-800 pour une variante plus sombre
          "base-300": "#334155", // slate-700 pour une autre variante
          "base-content": "#E0F2FE", // sky-50 pour le texte sur fond sombre
        },
      },
    ],
  },
};