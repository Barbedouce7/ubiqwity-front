// useTheme.jsx
import { useState, useEffect, useCallback } from 'react';

export const useTheme = () => {
  const detectTheme = useCallback(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      return document.documentElement.classList.contains("dark") || 
             document.documentElement.classList.contains("vibrant") 
             ? "dark" 
             : "light";
    }
    return "light";
  }, []);

  const [theme, setTheme] = useState(detectTheme());
  useEffect(() => {
    setTheme(detectTheme());
  }, [detectTheme]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(detectTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [detectTheme]);

  const colors = {
    text: theme === "dark" ? "#f8f9fa" : "#212529",
    primary: theme === "dark" ? "#0ea5e9" : "#11658b",
  };

  return { theme, colors };
};