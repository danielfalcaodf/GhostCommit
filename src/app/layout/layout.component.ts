import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigationShellComponent, NavigationItem } from '../shared/components/navigation-shell/navigation-shell.component';
import { GitService } from '../core/services/git.service';
import { GitRepository } from '../shared/models';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    NavigationShellComponent
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  currentRepository: GitRepository | null = null;
  pageTitle: string = 'GhostCommit';
  pageSubtitle: string = 'Comparador de Commits Git';

  navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Comparar Commits',
      icon: 'compare',
      route: '/git-compare',
      badge: 0
    },
    {
      label: 'Editor de Código',
      icon: 'code',
      route: '/code-editor'
    },
    {
      label: 'Repositório',
      icon: 'folder',
      children: [
        {
          label: 'Abrir Repositório',
          icon: 'folder_open',
          action: () => this.openRepository()
        },
        {
          label: 'Histórico',
          icon: 'history',
          route: '/history'
        },
        {
          label: 'Branches',
          icon: 'account_tree',
          route: '/branches'
        }
      ]
    },
    {
      label: 'Configurações',
      icon: 'settings',
      route: '/settings'
    }
  ];

  quickActions: NavigationItem[] = [
    {
      label: 'Atualizar',
      icon: 'refresh',
      action: () => this.refreshRepository()
    },
    {
      label: 'Notificações',
      icon: 'notifications',
      badge: 3,
      action: () => this.showNotifications()
    }
  ];

  constructor(private gitService: GitService) {}

  ngOnInit() {
    // Verificar se há um repositório atual
    this.currentRepository = this.gitService.getCurrentRepository();
    
    // Atualizar título baseado no repositório
    this.updatePageTitle();
  }

  onNavigationChange(item: NavigationItem) {
    console.log('Navigation changed:', item);
    // Lógica adicional para mudança de navegação
  }

  onSidenavToggle(opened: boolean) {
    console.log('Sidenav toggled:', opened);
    // Lógica adicional para toggle do sidenav
  }

  private openRepository() {
    // Implementar lógica para abrir repositório
    console.log('Open repository action');
  }

  private refreshRepository() {
    // Implementar lógica para atualizar repositório
    console.log('Refresh repository action');
  }

  private showNotifications() {
    // Implementar lógica para mostrar notificações
    console.log('Show notifications action');
  }

  private updatePageTitle() {
    if (this.currentRepository) {
      this.pageTitle = this.currentRepository.name;
      this.pageSubtitle = `Branch: ${this.currentRepository.current_branch}`;
    }
  }
}
