import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Components
import { 
  RepoSelectorComponent,
  CommitPickerComponent,
  FileTreeComponent,
  DiffViewerComponent
} from '../shared/components';

// Services & Models
import { GitService } from '../core/services/git.service';
import { NotificationService } from '../core/services/notification.service';
import { 
  GitRepository, 
  GitRef, 
  GitDiffFile, 
  GitFileComparison,
  GitComparisonResult 
} from '../shared/models';

@Component({
  selector: 'app-git-compare-example',
  standalone: true,
  imports: [
    CommonModule,
    RepoSelectorComponent,
    CommitPickerComponent,
    FileTreeComponent,
    DiffViewerComponent
  ],
  templateUrl: './git-compare-example.component.html',
  styleUrls: ['./git-compare-example.component.scss']
})
export class GitCompareExampleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State
  currentRepository: GitRepository | null = null;
  selectedCommits: { A: GitRef | null; B: GitRef | null } = { A: null, B: null };
  comparisonResult: GitComparisonResult | null = null;
  selectedFileComparison: GitFileComparison | null = null;
  loading = false;
  loadingMessage = '';

  constructor(
    private gitService: GitService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Verificar se há um repositório já aberto
    this.currentRepository = this.gitService.getCurrentRepository();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Event Handlers

  onRepositorySelected(repository: GitRepository) {
    console.log('Repository selected:', repository);
  }

  onRepositoryOpened(repository: GitRepository) {
    this.currentRepository = repository;
    this.notificationService.showSuccess(`Repositório ${repository.name} aberto com sucesso`);
    
    // Resetar seleções
    this.selectedCommits = { A: null, B: null };
    this.comparisonResult = null;
    this.selectedFileComparison = null;
  }

  onCommitSelectionChanged(selection: { commitA: GitRef | null; commitB: GitRef | null }) {
    this.selectedCommits = { A: selection.commitA, B: selection.commitB };
    
    // Limpar comparação anterior
    this.comparisonResult = null;
    this.selectedFileComparison = null;
  }

  onCompareRequested(selection: { fromRef: string; toRef: string; fromName: string; toName: string }) {
    if (!this.currentRepository) return;

    this.loading = true;
    this.loadingMessage = 'Comparando commits...';

    this.gitService.compareCommits(
      selection.fromRef,
      selection.toRef
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result: GitComparisonResult) => {
        this.comparisonResult = result;
        this.loading = false;
        
        this.notificationService.showSuccess(
          `Comparação concluída: ${result.diff.stats.totalFiles} arquivos modificados`
        );
      },
      error: (error: any) => {
        this.loading = false;
        this.notificationService.showError(`Erro na comparação: ${error.message}`);
      }
    });
  }

  onFileSelected(file: GitDiffFile) {
    if (!this.comparisonResult) return;

    const fileComparison = this.comparisonResult.fileDetails.get(file.path);
    if (fileComparison) {
      this.selectedFileComparison = fileComparison;
    } else {
      // Carregar detalhes do arquivo se não estiver em cache
      this.loadFileComparison(file.path);
    }
  }

  onFileChanged(filePath: string) {
    // Lógica para mudança de arquivo
    const file = this.comparisonResult?.diff.files.find(f => f.path === filePath);
    if (file) {
      this.onFileSelected(file);
    }
  }

  // Private Methods

  private loadFileComparison(filePath: string) {
    if (!this.currentRepository || !this.selectedCommits.A || !this.selectedCommits.B) return;

    this.loading = true;
    this.loadingMessage = `Carregando diferenças do arquivo ${filePath}...`;

    this.gitService.getFileComparison(
      this.selectedCommits.A.hash,
      this.selectedCommits.B.hash,
      filePath
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (fileComparison: GitFileComparison) => {
        this.selectedFileComparison = fileComparison;
        this.loading = false;

        // Atualizar o cache de comparações
        if (this.comparisonResult) {
          this.comparisonResult.fileDetails.set(filePath, fileComparison);
        }
      },
      error: (error: any) => {
        this.loading = false;
        this.notificationService.showError(`Erro ao carregar arquivo: ${error.message}`);
      }
    });
  }
}
