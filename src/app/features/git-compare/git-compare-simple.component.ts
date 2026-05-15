import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

// Services
import { GitService } from '../../core/services/git.service';
import { NotificationService } from '../../core/services/notification.service';

// Models
import { 
  GitRepository, 
  GitComparisonResult, 
  GitFileComparison, 
  GitRef,
  GitDiffFile
} from '../../shared/models';

// Components
import { 
  RepoSelectorComponent,
  CommitPickerComponent,
  FileTreeComponent,
  DiffViewerComponent
} from '../../shared/components';

interface AppState {
  repository: GitRepository | null;
  refs: GitRef[];
  commitA: string | null;
  commitB: string | null;
  comparison: GitComparisonResult | null;
  selectedFile: string | null;
  fileComparison: GitFileComparison | null;
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-git-compare-main',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    RepoSelectorComponent,
    CommitPickerComponent,
    FileTreeComponent,
    DiffViewerComponent
  ],
  templateUrl: './git-compare-simple.component.html',
  styleUrls: ['./git-compare-simple.component.scss']
})
export class GitCompareMainComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  state: AppState = {
    repository: null,
    refs: [],
    commitA: null,
    commitB: null,
    comparison: null,
    selectedFile: null,
    fileComparison: null,
    loading: false,
    error: null
  };

  constructor(
    private gitService: GitService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Inicialização
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

  private async loadRepositoryData() {
    if (!this.state.repository) return;

    this.state.loading = true;
    
    try {
      const refs = await this.gitService.getAllRefs().toPromise();
      this.state.refs = refs || [];
    } catch (error: any) {
      this.state.error = `Erro ao carregar dados: ${error.message}`;
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
    } finally {
      this.state.loading = false;
    }
  }

  async onFileSelected(file: GitDiffFile) {
    if (!this.state.commitA || !this.state.commitB) return;

    this.state.selectedFile = file.path;
    this.state.loading = true;

    try {
      const fileComparison = await this.gitService.getFileComparison(
        this.state.commitA,
        this.state.commitB,
        file.path
      ).toPromise();

      this.state.fileComparison = fileComparison || null;
      
    } catch (error: any) {
      this.notificationService.showError(`Erro ao carregar arquivo: ${error.message}`);
    } finally {
      this.state.loading = false;
    }
  }

  clearError() {
    this.state.error = null;
  }

  getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'added': return 'add';
      case 'deleted': return 'remove';
      case 'modified': return 'edit';
      case 'renamed': return 'drive_file_rename_outline';
      case 'copied': return 'content_copy';
      default: return 'description';
    }
  }
}
