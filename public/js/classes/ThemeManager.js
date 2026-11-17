/**
 * ThemeManager Class
 * Manages dark/light theme switching and persistence
 */

import { THEME_CONFIG } from '../config.js';

export class ThemeManager {
    constructor() {
        this.storageKey = THEME_CONFIG.storageKey;
        this.defaultTheme = THEME_CONFIG.default;
        this.htmlElement = document.documentElement;
        this.currentTheme = this.loadTheme();
    }

    /**
     * Load theme from localStorage or use default
     * @returns {string}
     */
    loadTheme() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored && THEME_CONFIG.modes.includes(stored)) {
            return stored;
        }
        return this.defaultTheme;
    }

    /**
     * Initialize theme on page load
     */
    init() {
        this.setTheme(this.currentTheme);
        this.setupToggleButton();
    }

    /**
     * Set theme and update DOM
     * @param {string} theme - 'dark' or 'light'
     */
    setTheme(theme) {
        if (!THEME_CONFIG.modes.includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }

        this.currentTheme = theme;
        this.htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.storageKey, theme);
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    /**
     * Toggle between dark and light themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Setup theme toggle button
     */
    setupToggleButton() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }
    }

    /**
     * Get current theme
     * @returns {string}
     */
    getTheme() {
        return this.currentTheme;
    }

    /**
     * Check if dark mode is active
     * @returns {boolean}
     */
    isDarkMode() {
        return this.currentTheme === 'dark';
    }
}

export default ThemeManager;
