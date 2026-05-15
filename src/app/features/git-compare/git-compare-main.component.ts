import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, map, catchError, startWith } from 'rxjs/operators';

// Angular Material
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

// Services
import { GitService } from '../../core/services/git.service';
import { NotificationService } from '../../core/services/notification.service';
import { TauriService } from '../../core/services/tauri.service';

// Models
import { 
  GitRepository, 
  GitComparisonResult, 
  GitFileComparison, 
  GitRef,
  GitDiff,
  GitDiffFile
} from '../../shared/models';

// Components
import { 
  RepoSelectorComponent,
  CommitPickerComponent,
  FileTreeComponent,
  DiffViewerComponent
} from '../../shared/components';

interface DiffFilter {
  authors: string[];
  extensions: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  textSearch: string;
  statusFilter: string[];
  minSize: number | null;
  maxSize: number | null;
}

interface SearchResult {
  query: string;
  results: any[];
  total_matches: number;
  took_ms: number;
}

interface GitCompareState {
  repository: GitRepository | null;
  refs: GitRef[];
  commitA: string | null;
  commitB: string | null;
  comparison: GitComparisonResult | null;
  selectedFile: string | null;
  fileComparison: GitFileComparison | null;
  filters: DiffFilter;
  searchResults: SearchResult | null;
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-git-compare-main',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatToolbarModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule,
    RepoSelectorComponent,
    CommitPickerComponent,
    FileTreeComponent,
    DiffViewerComponent,
    DiffFiltersComponent,
    DiffStatsComponent,
    ExportDialogComponent,
    HistorySearchComponent
  ],
  templateUrl: './git-compare-main.component.html',
  styleUrls: ['./git-compare-main.component.scss']
})
export class GitCompareMainComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav: any;

  private destroy$ = new Subject<void>();
  
  // Estado principal da aplicação
  state: GitCompareState = {
    repository: null,
    refs: [],
    commitA: null,
    commitB: null,
    comparison: null,
    selectedFile: null,
    fileComparison: null,
    filters: {
      authors: [],
      extensions: [],
      dateFrom: null,
      dateTo: null,
      textSearch: '',
      statusFilter: [],
      minSize: null,
      maxSize: null
    },
    searchResults: null,
    repositoryStats: null,
    loading: false,
    error: null
  };

  constructor(
    private gitService: GitService,
    private notificationService: NotificationService,
    private tauriService: TauriService
  ) {}

  ngOnInit() {
    // Configuração inicial
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRepositorySelected(repository: GitRepository) {
    this.state.repository = repository;
    this.state.error = null;
    this.loadRepositoryData();
  }

  onRepositoryChanged(path: string) {
    // Reset do estado quando o caminho muda
    if (path !== this.state.repository?.path) {
      this.resetState();
    }
  }

  private async loadRepositoryData() {
    if (!this.state.repository) return;

    this.state.loading = true;
    
    try {
      // Carregar refs em paralelo
      const refs$ = this.gitService.getAllRefs();
      const stats$ = this.gitService.getRepositoryStats();

      const [refs, stats] = await Promise.all([
        refs$.toPromise(),
        stats$.toPromise()
      ]);

      this.state.refs = refs || [];
      this.state.repositoryStats = stats || null;
      
    } catch (error: any) {
      this.state.error = `Erro ao carregar dados do repositório: ${error.message}`;
      this.notificationService.showError(this.state.error);
    } finally {
      this.state.loading = false;
    }
  }

  onCommitASelected(ref: GitRef) {
    this.state.commitA = ref.hash;
  }

  onCommitBSelected(ref: GitRef) {
    this.state.commitB = ref.hash;
  }

  async compareCommits() {
    if (!this.state.commitA || !this.state.commitB) {
      this.notificationService.showError('Selecione dois commits para comparar');
      return;
    }

    this.state.loading = true;
    this.state.error = null;

    try {
      const comparison = await this.gitService.compareCommits(
        this.state.commitA,
        this.state.commitB
      ).toPromise();

      this.state.comparison = comparison || null;
      this.notificationService.showSuccess('Comparação realizada com sucesso');
      
    } catch (error: any) {
      this.state.error = `Erro na comparação: ${error.message}`;
      this.notificationService.showError(this.state.error);
    } finally {
      this.state.loading = false;
    }
  }

  async onFileSelected(filePath: string) {
    if (!this.state.commitA || !this.state.commitB) return;

    this.state.selectedFile = filePath;
    this.state.loading = true;

    try {
      const fileComparison = await this.gitService.getFileComparison(
        this.state.commitA,
        this.state.commitB,
        filePath
      ).toPromise();

      this.state.fileComparison = fileComparison || null;
      
    } catch (error: any) {
      this.notificationService.showError(`Erro ao carregar arquivo: ${error.message}`);
    } finally {
      this.state.loading = false;
    }
  }

  onFiltersChanged(filters: DiffFilter) {
    this.state.filters = { ...filters };
  }

  onSearchResults(results: GitSearchResult) {
    this.state.searchResults = results;
  }

  async exportComparison(format: ExportFormat) {
    if (!this.state.comparison) return;

    try {
      // Implementar exportação via ExportDialogComponent
      this.notificationService.showInfo(`Exportação ${format} será implementada`);
    } catch (error: any) {
      this.notificationService.showError(`Erro na exportação: ${error.message}`);
    }
  }

  async refreshRepository() {
    if (this.state.repository) {
      await this.loadRepositoryData();
    }
  }

  toggleSidenav() {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  clearError() {
    this.state.error = null;
  }

  getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  private resetState() {
    this.state = {
      repository: null,
      refs: [],
      commitA: null,
      commitB: null,
      comparison: null,
      selectedFile: null,
      fileComparison: null,
      filters: {
        authors: [],
        extensions: [],
        dateFrom: null,
        dateTo: null,
        textSearch: '',
        statusFilter: [],
        minSize: null,
        maxSize: null
      },
      searchResults: null,
      repositoryStats: null,
      loading: false,
      error: null
    };
  }
}
