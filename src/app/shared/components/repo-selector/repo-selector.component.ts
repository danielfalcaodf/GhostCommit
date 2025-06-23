import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, startWith, takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

// Services
import { GitService } from '../../../core/services/git.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TauriService } from '../../../core/services/tauri.service';
import { GitRepository } from '../../models';

interface RepoSuggestion {
  path: string;
  name: string;
  isValid: boolean;
  isGitRepo?: boolean;
  lastAccessed?: Date;
  branch?: string;
  commits?: number;
  size?: string;
}

interface RepoValidationResult {
  isValid: boolean;
  isGitRepo: boolean;
  branch?: string;
  commits?: number;
  size?: string;
  error?: string;
}

@Component({
  selector: 'app-repo-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './repo-selector.component.html',
  styleUrls: ['./repo-selector.component.scss']
})
export class RepoSelectorComponent implements OnInit, OnDestroy {
  @Output() repositorySelected = new EventEmitter<GitRepository>();
  @Output() repositoryChanged = new EventEmitter<string>();

  private destroy$ = new Subject<void>();

  repoControl = new FormControl('');
  filteredRepos: Observable<RepoSuggestion[]>;
  recentRepos: RepoSuggestion[] = [];
  loading = false;

  private allRepos: RepoSuggestion[] = [
    // Exemplos de repositórios comuns (em produção, viria de localStorage ou API)
    { path: '/home/user/projects', name: 'projects', isValid: true, lastAccessed: new Date() },
    { path: '/home/user/workspace', name: 'workspace', isValid: true },
    { path: 'C:\\Users\\user\\Documents\\GitHub', name: 'GitHub', isValid: true },
    { path: 'C:\\Users\\user\\source\\repos', name: 'repos', isValid: false },
  ];

  constructor(
    private gitService: GitService,
    private notificationService: NotificationService,
    private tauriService: TauriService
  ) {
    // Configurar filtro de autocomplete
    this.filteredRepos = this.repoControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => this.filterRepos(value || ''))
    );
  }

  ngOnInit() {
    this.loadRecentRepos();
    
    // Monitorar mudanças no input
    this.repoControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500)
    ).subscribe(value => {
      this.repositoryChanged.emit(value || '');
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private filterRepos(value: string): RepoSuggestion[] {
    const filterValue = value.toLowerCase();
    return this.allRepos.filter(repo => 
      repo.name.toLowerCase().includes(filterValue) ||
      repo.path.toLowerCase().includes(filterValue)
    );
  }

  private loadRecentRepos() {
    // Em produção, carregar do localStorage
    const stored = localStorage.getItem('ghost-commit-recent-repos');
    if (stored) {
      try {
        this.recentRepos = JSON.parse(stored).map((repo: any) => ({
          ...repo,
          lastAccessed: new Date(repo.lastAccessed)
        }));
      } catch (error) {
        console.warn('Erro ao carregar repositórios recentes:', error);
      }
    }
  }

  private saveRecentRepo(repo: RepoSuggestion) {
    // Adicionar aos recentes
    const existing = this.recentRepos.findIndex(r => r.path === repo.path);
    if (existing >= 0) {
      this.recentRepos.splice(existing, 1);
    }
    
    this.recentRepos.unshift({
      ...repo,
      lastAccessed: new Date()
    });

    // Manter apenas os últimos 10
    this.recentRepos = this.recentRepos.slice(0, 10);

    // Salvar no localStorage
    localStorage.setItem('ghost-commit-recent-repos', JSON.stringify(this.recentRepos));
  }

  onRepoSelected(path: string) {
    this.repoControl.setValue(path);
    this.validateAndOpen(path);
  }

  selectRecentRepo(repo: RepoSuggestion) {
    this.repoControl.setValue(repo.path);
    if (repo.isValid) {
      this.validateAndOpen(repo.path);
    }
  }

  async browseFolder() {
    if (this.tauriService.isTauri()) {
      try {
        // Usar comando Tauri para diálogo nativo
        const path = await this.tauriService.openFolderDialog().toPromise();
        if (path) {
          this.repoControl.setValue(path);
          this.validateAndOpen(path);
        }
      } catch (error: any) {
        this.notificationService.showError(`Erro ao abrir diálogo: ${error.message}`);
      }
    } else {
      // Fallback para web
      const path = window.prompt('Digite o caminho do repositório:');
      if (path) {
        this.repoControl.setValue(path);
        this.validateAndOpen(path);
      }
    }
  }

  openRepository() {
    const path = this.repoControl.value;
    if (path) {
      this.validateAndOpen(path);
    }
  }

  private async validateAndOpen(path: string) {
    this.loading = true;

    try {
      // Primeiro, validar se é um repositório Git válido
      const isValid = await this.gitService.isValidRepository(path).toPromise();
      
      if (!isValid) {
        this.notificationService.showError('O caminho não contém um repositório Git válido');
        return;
      }

      // Abrir o repositório
      const repository = await this.gitService.openRepository(path).toPromise();
      
      // Salvar nos recentes
      this.saveRecentRepo({
        path,
        name: repository?.name || path.split(/[/\\]/).pop() || 'Repositório',
        isValid: true,
        lastAccessed: new Date()
      });

      // Emitir evento
      if (repository) {
        this.repositorySelected.emit(repository);
      }

    } catch (error: any) {
      this.notificationService.showError(`Erro ao abrir repositório: ${error.message}`);
    } finally {
      this.loading = false;
    }
  }

  formatPath(path: string): string {
    // Formatar path para exibição compacta
    if (path.length > 40) {
      const parts = path.split(/[/\\]/);
      if (parts.length > 3) {
        return `${parts[0]}/.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
      }
    }
    return path;
  }
}
