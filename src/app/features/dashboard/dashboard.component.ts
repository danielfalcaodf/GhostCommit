import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TauriService } from '../../core/services/tauri.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats = {
    filesModified: 12,
    commits: 3,
    branches: 2,
    timeSpent: '4.2h'
  };

  recentActivity = [
    { icon: 'commit', action: 'Commit: feat: nova funcionalidade', time: '2 min atrás', type: 'commit' },
    { icon: 'edit', action: 'Editou arquivo: app.component.ts', time: '5 min atrás', type: 'edit' },
    { icon: 'save', action: 'Salvou projeto', time: '10 min atrás', type: 'save' },
    { icon: 'commit', action: 'Commit: fix: correção de bug', time: '1h atrás', type: 'commit' }
  ];

  constructor(
    private tauriService: TauriService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Simular carregamento de dados
    this.notificationService.info(
      'Dashboard',
      'Dados carregados com sucesso!',
      3000
    );
  }

  testTauri(): void {
    this.tauriService.greet('Usuário').subscribe({
      next: (response) => {
        this.notificationService.success(
          'Tauri Test',
          response,
          3000
        );
      },
      error: (error) => {
        this.notificationService.error(
          'Erro Tauri',
          'Falha ao conectar com Tauri',
          5000
        );
      }
    });
  }

  openTerminal(): void {
    this.notificationService.info('Terminal', 'Funcionalidade em desenvolvimento', 2000);
  }
}
