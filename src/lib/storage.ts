export type ThemeMode = 'light' | 'sky' | 'anthracite' | 'wine' | 'mint' | 'dark' | 'sapphire';
export type ScreenScaleLevel = 1 | 2 | 3;

export class StorageService {
  private static readonly SCALE_KEY = 'coaching_screen_scale';
  private static readonly THEME_KEY = 'coaching_theme';

  /**
   * Get current screen scale level (1, 2, or 3)
   * 1 = Standard, 2 = Comfortable Wide (1.4x), 3 = Ultra Wide (1.8x)
   */
  static getScreenScale(): ScreenScaleLevel {
    if (typeof window === 'undefined') return 1;

    const stored = localStorage.getItem(this.SCALE_KEY);
    const parsed = stored ? parseInt(stored, 10) : 1;

    if ([1, 2, 3].includes(parsed)) {
      return parsed as ScreenScaleLevel;
    }
    return 1;
  }

  /**
   * Set screen scale level and apply to DOM
   */
  static setScreenScale(scale: ScreenScaleLevel): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.SCALE_KEY, String(scale));

    // Apply to HTML element
    const html = document.documentElement;
    html.classList.remove('scale-tier-2', 'scale-tier-3');

    if (scale === 2) {
      html.classList.add('scale-tier-2');
    } else if (scale === 3) {
      html.classList.add('scale-tier-3');
    }
  }

  /**
   * Get current theme
   */
  static getTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'light';

    const stored = localStorage.getItem(this.THEME_KEY);
    const validThemes: ThemeMode[] = ['light', 'sky', 'anthracite', 'wine', 'mint', 'dark', 'sapphire'];

    if (stored && validThemes.includes(stored as ThemeMode)) {
      return stored as ThemeMode;
    }
    return 'light';
  }

  /**
   * Set theme
   */
  static setTheme(theme: ThemeMode): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.THEME_KEY, theme);
  }

  /**
   * Apply theme and scale together
   */
  static applyThemeAndScale(theme: ThemeMode, scale: ScreenScaleLevel): void {
    if (typeof window === 'undefined') return;

    this.setTheme(theme);
    this.setScreenScale(scale);

    // Apply theme class to html or body
    const html = document.documentElement;

    // Remove all theme classes
    ['light', 'sky', 'anthracite', 'wine', 'mint', 'dark', 'sapphire'].forEach(t => {
      html.classList.remove(`theme-${t}`);
    });

    // Add new theme class
    html.classList.add(`theme-${theme}`);
  }

  /**
   * Check for unread messages (template for chat feature)
   */
  static hasUnreadMessages(userId: string): boolean {
    if (typeof window === 'undefined') return false;
    const key = `unread_${userId}`;
    return localStorage.getItem(key) === 'true';
  }

  /**
   * Mark messages as read
   */
  static markMessagesRead(userId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`unread_${userId}`);
  }

  /**
   * Clear all stored preferences
   */
  static clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
}
