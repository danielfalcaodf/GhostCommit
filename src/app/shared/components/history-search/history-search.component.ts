import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';

// Services
import { GitService } from '../../../core/services/git.service';
import { NotificationService } from '../../../core/services/notification.service';

// Models
import { GitCommit, GitRepository } from '../../models';

export interface HistorySearchResult {
  commits: GitCommit[];
  searchTerm: string;
  searchType: 'pickaxe' | 'grep' | 'log';
  totalFound: number;
}

export interface PickaxeResult {
  commit: GitCommit;
  files: {
    path: string;
    additions: string[];
    deletions: string[];
    context: string[];
  }[];
}

@Component({
  selector: 'app-history-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatExpansionModule,
    MatTooltipModule,
    MatTabsModule
  ],
  templateUrl: './history-search.component.html',
  styleUrls: ['./history-search.component.scss']
})
export class HistorySearchComponent implements OnInit, OnDestroy {
  @Input() repository: GitRepository | null = null;
  @Output() commitSelected = new EventEmitter<GitCommit>();
  @Output() compareRequested = new EventEmitter<{ fromCommit: string; toCommit: string }>();

  private destroy$ = new Subject<void>();

  searchForm = new FormGroup({
    searchTerm: new FormControl('', [Validators.required, Validators.minLength(3)]),
    searchType: new FormControl<'pickaxe' | 'grep' | 'log'>('pickaxe'),
    author: new FormControl(''),
    limit: new FormControl('25'),
    filePath: new FormControl(''),
    branch: new FormControl('')
  });

  searching = false;
  searchResults: HistorySearchResult | null = null;
  recentSearches: HistorySearchResult[] = [];
  hasMoreResults = false;
  pickaxeResults: Map<string, PickaxeResult> = new Map();

  constructor(
    private gitService: GitService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadRecentSearches();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  performSearch() {
    if (this.searchForm.invalid || !this.repository) return;

    const formValue = this.searchForm.value;
    this.searching = true;
    this.searchResults = null;

    const searchOptions = {
      term: formValue.searchTerm!,
      type: formValue.searchType!,
      author: formValue.author || undefined,
      limit: parseInt(formValue.limit || '25'),
      filePath: formValue.filePath || undefined,
      branch: formValue.branch || undefined
    };

    this.gitService.searchHistory(searchOptions).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.notificationService.showError(`Erro na busca: ${error.message}`);
        this.searching = false;
        throw error;
      })
    ).subscribe(results => {
      this.searchResults = results;
      this.searching = false;
      this.hasMoreResults = results.commits.length >= searchOptions.limit;
      
      this.saveRecentSearch(results);
      
      if (results.totalFound === 0) {
        this.notificationService.showInfo('Nenhum resultado encontrado');
      } else {
        this.notificationService.showSuccess(`${results.totalFound} commits encontrados`);
      }

      // Carregar contexto do pickaxe se necessário
      if (formValue.searchType === 'pickaxe') {
        this.loadPickaxeContext(results.commits, formValue.searchTerm!);
      }
    });
  }

  loadMoreResults() {
    // Implementar carregamento de mais resultados
    console.log('Loading more results...');
  }

  loadRecentSearch(search: HistorySearchResult) {
    this.searchForm.patchValue({
      searchTerm: search.searchTerm,
      searchType: search.searchType
    });
    this.searchResults = search;
  }

  viewCommitDiff(commit: GitCommit) {
    this.commitSelected.emit(commit);
  }

  compareWithCurrent(commit: GitCommit) {
    this.compareRequested.emit({
      fromCommit: commit.hash,
      toCommit: 'HEAD'
    });
  }

  viewFileAtCommit(commit: GitCommit) {
    // Implementar visualização de arquivo no commit
    console.log('View file at commit:', commit.hash);
  }

  getSearchTypeDescription(type: string): string {
    switch (type) {
      case 'pickaxe': return 'Busca por adição/remoção de texto específico';
      case 'grep': return 'Busca regex no conteúdo do diff';
      case 'log': return 'Busca na mensagem dos commits';
      default: return '';
    }
  }

  getPickaxeResult(commit: GitCommit): PickaxeResult | null {
    return this.pickaxeResults.get(commit.hash) || null;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  trackCommit(index: number, commit: GitCommit): string {
    return commit.hash;
  }

  private loadRecentSearches() {
    const saved = localStorage.getItem('ghost-commit-recent-searches');
    if (saved) {
      try {
        this.recentSearches = JSON.parse(saved).slice(0, 5);
      } catch (error) {
        console.warn('Error loading recent searches:', error);
      }
    }
  }

  private saveRecentSearch(search: HistorySearchResult) {
    // Remover busca existente se houver
    this.recentSearches = this.recentSearches.filter(s => s.searchTerm !== search.searchTerm);
    
    // Adicionar no início
    this.recentSearches.unshift(search);
    
    // Manter apenas 5 recentes
    this.recentSearches = this.recentSearches.slice(0, 5);
    
    // Salvar no localStorage
    localStorage.setItem('ghost-commit-recent-searches', JSON.stringify(this.recentSearches));
  }

  private loadPickaxeContext(commits: GitCommit[], searchTerm: string) {
    // Implementar carregamento do contexto do pickaxe
    commits.forEach(commit => {
      // Simular resultado do pickaxe
      const mockResult: PickaxeResult = {
        commit,
        files: [
          {
            path: 'src/example.ts',
            additions: [`  ${searchTerm} // Added in this commit`],
            deletions: [],
            context: ['  function example() {', '    // context line', '  }']
          }
        ]
      };
      
      this.pickaxeResults.set(commit.hash, mockResult);
    });
  }
}
