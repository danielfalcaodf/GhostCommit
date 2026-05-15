import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services and Models
import { GitService } from '../../core/services/git.service';
import { NotificationService } from '../../core/services/notification.service';
import { 
  GitRepository, 
  GitRef, 
  GitComparisonResult, 
  GitFileComparison,
  GitRefType 
} from '../../shared/models';

// Shared Components
import { MonacoEditorComponent } from '../../shared/components/monaco-editor/monaco-editor.component';

@Component({
  selector: 'app-git-compare',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatExpansionModule,
    MatTooltipModule,
    MonacoEditorComponent
  ],
  templateUrl: './git-compare.component.html',
  styleUrls: ['./git-compare.component.scss']
})
export class GitCompareComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State
  currentRepository: GitRepository | null = null;
  allRefs: GitRef[] = [];
  groupedRefs: { label: string; refs: GitRef[] }[] = [];
  fromRef = '';
  toRef = '';
  comparisonResult: GitComparisonResult | null = null;
  fileComparisons = new Map<string, GitFileComparison>();
  loading = false;
  loadingMessage = '';
  loadingFile = '';

  // Editor options
  editorOptions = {
    readOnly: true,
    automaticLayout: true,
    fontSize: 12,
    minimap: { enabled: false },
    scrollBeyondLastLine: false
  };

  diffEditorOptions = {
    ...this.editorOptions,
    wordWrap: 'off',
    renderSideBySide: false
  };

  constructor(
    private gitService: GitService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Se já há um repositório aberto, carregar refs
    const currentRepo = this.gitService.getCurrentRepository();
    if (currentRepo) {
      this.currentRepository = currentRepo;
      this.loadRefs();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async openRepository() {
    // Em um app real, usaria um dialog de seleção de pasta
    // Por agora, usar um prompt simples
    const path = window.prompt('Digite o caminho do repositório Git:');
    if (!path) return;

    this.loading = true;
    this.loadingMessage = 'Abrindo repositório...';

    this.gitService.openRepository(path)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (repo) => {
          this.currentRepository = repo;
          this.loadRefs();
        },
        error: (error) => {
          this.notificationService.showError(`Erro ao abrir repositório: ${error.message}`);
          this.loading = false;
        }
      });
  }

  private loadRefs() {
    this.loading = true;
    this.loadingMessage = 'Carregando commits, branches e tags...';

    this.gitService.getAllRefs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (refs) => {
          this.allRefs = refs;
          this.groupRefs();
          this.loading = false;
        },
        error: (error) => {
          this.notificationService.showError(`Erro ao carregar referências: ${error.message}`);
          this.loading = false;
        }
      });
  }

  private groupRefs() {
    const branches = this.allRefs.filter(ref => ref.type === GitRefType.BRANCH);
    const tags = this.allRefs.filter(ref => ref.type === GitRefType.TAG);
    const commits = this.allRefs.filter(ref => ref.type === GitRefType.COMMIT);

    this.groupedRefs = [
      { label: 'Branches', refs: branches },
      { label: 'Tags', refs: tags },
      { label: 'Commits Recentes', refs: commits }
    ].filter(group => group.refs.length > 0);
  }

  canCompare(): boolean {
    return !!(this.fromRef && this.toRef && this.fromRef !== this.toRef);
  }

  compareCommits() {
    if (!this.canCompare()) return;

    this.loading = true;
    this.loadingMessage = 'Comparando commits...';
    this.comparisonResult = null;
    this.fileComparisons.clear();

    this.gitService.compareCommits(this.fromRef, this.toRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.comparisonResult = result;
          this.loading = false;
        },
        error: (error) => {
          this.notificationService.showError(`Erro na comparação: ${error.message}`);
          this.loading = false;
        }
      });
  }

  loadFileComparison(filePath: string) {
    if (this.fileComparisons.has(filePath)) return;

    this.loadingFile = filePath;

    this.gitService.getFileComparison(this.fromRef, this.toRef, filePath)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comparison) => {
          this.fileComparisons.set(filePath, comparison);
          this.loadingFile = '';
        },
        error: (error) => {
          this.notificationService.showError(`Erro ao carregar arquivo: ${error.message}`);
          this.loadingFile = '';
        }
      });
  }

  openInEditor(filePath: string) {
    // Implementar abertura no editor de código
    this.notificationService.showInfo(`Abrindo ${filePath} no editor...`);
    // Redirecionar para o editor com o arquivo
  }

  getRefIcon(type: GitRefType): string {
    switch (type) {
      case GitRefType.BRANCH:
        return 'call_split';
      case GitRefType.TAG:
        return 'local_offer';
      case GitRefType.COMMIT:
        return 'commit';
      default:
        return 'help';
    }
  }

  getFileStatusIcon(status: string): string {
    switch (status) {
      case 'added':
        return 'add';
      case 'deleted':
        return 'remove';
      case 'modified':
        return 'edit';
      case 'renamed':
        return 'drive_file_rename_outline';
      case 'copied':
        return 'content_copy';
      default:
        return 'help';
    }
  }

  detectLanguage(filePath: string): string {
    return this.gitService.detectLanguage(filePath);
  }

  formatUnifiedDiff(comparison: GitFileComparison): string {
    // Formatar diff unificado para exibição no Monaco Editor
    let diff = `--- a/${comparison.file.path}\n+++ b/${comparison.file.path}\n`;
    
    comparison.hunks.forEach(hunk => {
      diff += `${hunk.header}\n`;
      hunk.lines.forEach(line => {
        const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';
        diff += `${prefix}${line.content}\n`;
      });
    });

    return diff;
  }
}
