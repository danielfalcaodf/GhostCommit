import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services and Models
import { GitService } from '../../../core/services/git.service';
import { GitCompareStateService } from '../../../core/services/git-compare-state.service';
import { SnackBarNotificationService } from '../../../core/services/snackbar-notification.service';
import { GitFileComparison, GitFileDiff } from '../../../shared/models/git.models';

@Component({
  selector: 'app-git-diff',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './git-diff.component.html',
  styleUrl: './git-diff.component.scss'
})
export class GitDiffComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Route parameters
  repoPath = '';
  fromRef = '';
  toRef = '';
  filePath = '';

  // Component state
  fileComparison?: GitFileComparison;
  loading = false;
  loadingMessage = '';
  diffContent = '';
  error?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gitService: GitService,
    private stateService: GitCompareStateService,
    private notificationService: SnackBarNotificationService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.repoPath = decodeURIComponent(params['repoPath']);
      this.fromRef = params['fromRef'];
      this.toRef = params['toRef'];
      this.filePath = decodeURIComponent(params['filePath']);
      this.loadFileDiff();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadFileDiff(): Promise<void> {
    if (!this.repoPath || !this.fromRef || !this.toRef || !this.filePath) {
      this.error = 'Parâmetros de comparação inválidos';
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Carregando diferenças do arquivo...';
    this.error = undefined;

    try {
      const comparison = await this.gitService.getFileComparison(
        this.fromRef,
        this.toRef,
        this.filePath
      ).toPromise();

      if (comparison) {
        this.fileComparison = comparison;
        this.generateDiffContent();
      } else {
        this.error = 'Não foi possível carregar as diferenças do arquivo';
      }
    } catch (error) {
      console.error('Erro ao carregar diff do arquivo:', error);
      this.error = 'Erro ao carregar diferenças do arquivo';
      this.notificationService.showError('Erro ao carregar diferenças do arquivo');
    } finally {
      this.loading = false;
    }
  }

  private generateDiffContent(): void {
    if (!this.fileComparison?.hunks) {
      this.diffContent = 'Nenhuma diferença encontrada';
      return;
    }

    let content = '';
    this.fileComparison.hunks.forEach(hunk => {
      content += `${hunk.header}\n`;
      hunk.lines.forEach(line => {
        const prefix = line.type === 'added' ? '+' : line.type === 'deleted' ? '-' : ' ';
        content += `${prefix}${line.content}\n`;
      });
      content += '\n';
    });

    this.diffContent = content;
  }

  goBack(): void {
    this.router.navigate(['/git-compare']);
  }

  getFileStatusIcon(status: string): string {
    switch (status) {
      case 'added': return 'add_circle';
      case 'deleted': return 'remove_circle';
      case 'modified': return 'edit';
      case 'renamed': return 'drive_file_rename_outline';
      case 'copied': return 'content_copy';
      default: return 'description';
    }
  }

  copyDiffToClipboard(): void {
    navigator.clipboard.writeText(this.diffContent).then(() => {
      this.notificationService.showSuccess('Diff copiado para a área de transferência');
    }).catch(() => {
      this.notificationService.showError('Erro ao copiar diff');
    });
  }

  downloadDiff(): void {
    const blob = new Blob([this.diffContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.filePath.replace(/[/\\]/g, '_')}_diff.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
