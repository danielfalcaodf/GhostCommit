import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private currentTheme$ = new BehaviorSubject<'light' | 'dark'>('dark');

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as 'light' | 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.setTheme(theme);
  }

  setTheme(theme: 'light' | 'dark'): void {
    const body = document.body;
    
    // Remove classe anterior
    body.classList.remove('light-theme', 'dark-theme');
    
    // Adiciona nova classe
    body.classList.add(`${theme}-theme`);
    
    // Salva no localStorage
    localStorage.setItem(this.THEME_KEY, theme);
    
    // Atualiza o observable
    this.currentTheme$.next(theme);
  }

  toggleTheme(): void {
    const currentTheme = this.currentTheme$.value;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme$.value;
  }

  get currentTheme() {
    return this.currentTheme$.asObservable();
  }

  isDarkMode(): boolean {
    return this.currentTheme$.value === 'dark';
  }
}
