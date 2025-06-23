import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout/layout.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    LayoutComponent
  ],
  template: '<app-layout></app-layout>',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'GhostCommit';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Inicializa o tema
    this.themeService.getCurrentTheme();
  }
}
