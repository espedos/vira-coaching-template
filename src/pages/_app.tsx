import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { StorageService, type ThemeMode, type ScreenScaleLevel } from '@/lib/storage';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [screenScale, setScreenScale] = useState<ScreenScaleLevel>(1);
  const [mounted, setMounted] = useState(false);

  // Load stored preferences on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = StorageService.getTheme();
      const savedScale = StorageService.getScreenScale();

      setTheme(savedTheme);
      setScreenScale(savedScale);

      // Apply to DOM
      StorageService.applyThemeAndScale(savedTheme, savedScale);
      setMounted(true);
    }
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-slate-300">Loading...</div>
      </div>
    );
  }

  return (
    <Component
      {...pageProps}
      theme={theme}
      setTheme={setTheme}
      screenScale={screenScale}
      setScreenScale={setScreenScale}
    />
  );
}
