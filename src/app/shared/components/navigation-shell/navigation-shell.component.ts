import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

// Models
import { GitRepository } from '../../models';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';



export interface NavigationItem {
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  badge?: number;
  disabled?: boolean;
  children?: NavigationItem[];
}

@Component({
  selector: 'app-navigation-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    MatBadgeModule,
    ThemeToggleComponent
],
  templateUrl: './navigation-shell.component.html',
  styleUrls: ['./navigation-shell.component.scss']
})
export class NavigationShellComponent {
  @Input() currentRepository: GitRepository | null = null;
  @Input() navigationItems: NavigationItem[] = [];
  @Input() quickActions: NavigationItem[] = [];
  @Input() pageTitle: string = 'GhostCommit';
  @Input() pageSubtitle: string = '';
  @Input() sidenavMode: 'over' | 'push' | 'side' = 'side';
  @Input() sidenavOpened: boolean = true;

  @Output() navigationChange = new EventEmitter<NavigationItem>();
  @Output() sidenavToggle = new EventEmitter<boolean>();

  @ViewChild('sidenav') sidenav!: MatSidenav;

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
    this.sidenavToggle.emit(this.sidenavOpened);
    
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  executeAction(item: NavigationItem): void {
    if (item.disabled) return;

    if (item.action) {
      item.action();
    }
    
    this.navigationChange.emit(item);
  }
}
