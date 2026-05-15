import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Services and Models
import { GitService } from '../../../core/services/git.service';
import { GitCompareStateService } from '../../../core/services/git-compare-state.service';
import { SnackBarNotificationService } from '../../../core/services/snackbar-notification.service';
import { GitFileComparison, GitFileDiff, GitBlameInfo, GitBlameLine } from '../../../shared/models/git.models';

// Components
import { MonacoBlameEditorComponent } from '../../../shared/components/monaco-blame-editor/monaco-blame-editor.component';
import { SideBySideDiffComponent } from '../../../shared/components/side-by-side-diff/side-by-side-diff.component';
import { EnhancedDiffStatsComponent } from '../../../shared/components/enhanced-diff-stats/enhanced-diff-stats.component';

@Component({
  selector: 'app-git-diff',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    MatSlideToggleModule,
    MonacoBlameEditorComponent,
    SideBySideDiffComponent,
    EnhancedDiffStatsComponent
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
  blameInfo?: GitBlameInfo;
  blameInfoOld?: GitBlameInfo;
  loading = false;
  loadingBlame = false;
  loadingMessage = '';
  diffContent = '';
  error?: string;
  
  // View mode and comparison features
  viewMode: 'diff' | 'monaco' | 'side-by-side' = 'side-by-side';
  showBlame = true;
  selectedAuthor = '';
  syncScrolling = true;
  
  // Author analysis
  authorChanges: Array<{
    lineNumber: number;
    type: 'added' | 'deleted' | 'modified';
    content: string;
    author: string;
  }> = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gitService: GitService,
    private stateService: GitCompareStateService,
    private notificationService: SnackBarNotificationService
  ) {}

  ngOnInit(): void {
    debugger
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.repoPath = decodeURIComponent(params['repoPath']);
      this.fromRef = params['fromRef'];
      this.toRef = params['toRef'];
      this.filePath = decodeURIComponent(params['filePath']);
      debugger
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
        
        // Carregar blame automaticamente para arquivos de código
        if (this.shouldLoadBlame()) {
          this.loadBlameInfo();
        }
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
    console.log('Generating diff content:', this.fileComparison);
    
    if (!this.fileComparison?.diff?.hunks || this.fileComparison.diff.hunks.length === 0) {
      this.diffContent = 'Nenhuma diferença encontrada';
      console.log('No hunks found');
      return;
    }

    console.log('Found hunks:', this.fileComparison.diff.hunks.length);
    
    let content = '';
    this.fileComparison.diff.hunks.forEach((hunk, index) => {
      console.log(`Processing hunk ${index}:`, hunk);
      content += `${hunk.header}\n`;
      
      if (hunk.lines && hunk.lines.length > 0) {
        hunk.lines.forEach((line, lineIndex) => {
          console.log(`Processing line ${lineIndex}:`, line);
          const prefix = line.type === 'added' ? '+' : line.type === 'deleted' ? '-' : ' ';
          content += `${prefix}${line.content}\n`;
        });
      }
      content += '\n';
    });

    this.diffContent = content;
    console.log('Final diff content:', this.diffContent);
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

  // Métodos para Monaco Editor e Blame
  shouldLoadBlame(): boolean {
    if (!this.fileComparison) return false;
    
    // Não carregar blame para arquivos binários
    if (this.fileComparison.binary) return false;
    
    // Carregar blame apenas para linguagens de código conhecidas
    const codeLanguages = [
      'typescript', 'javascript', 'python', 'java', 'csharp', 
      'cpp', 'c', 'rust', 'go', 'php', 'ruby', 'swift', 'kotlin'
    ];
    
    return codeLanguages.includes(this.fileComparison.language);
  }

  private async loadBlameInfo(): Promise<void> {
    if (!this.repoPath || !this.filePath) return;

    this.loadingBlame = true;
    
    try {
      // Carregar blame para versão nova
      const blame = await this.gitService.getFileBlame(
        this.filePath,
        this.toRef
      ).toPromise();

      if (blame) {
        this.blameInfo = blame;
      }

      // Carregar blame para versão antiga
      const blameOld = await this.gitService.getFileBlame(
        this.filePath,
        this.fromRef
      ).toPromise();

      if (blameOld) {
        this.blameInfoOld = blameOld;
      }

      // Analisar mudanças por autor
      this.analyzeAuthorChanges();
    } catch (error) {
      console.warn('Erro ao carregar blame:', error);
      // Não mostrar erro para blame, é funcionalidade opcional
    } finally {
      this.loadingBlame = false;
    }
  }

  private analyzeAuthorChanges(): void {
    if (!this.fileComparison?.diff?.hunks) return;

    this.authorChanges = [];
    const changes = new Map<string, Array<any>>();

    // Analisar hunks para extrair mudanças por autor
    this.fileComparison.diff.hunks.forEach(hunk => {
      if (hunk.lines) {
        hunk.lines.forEach((line, index) => {
          if (line.type === 'added' || line.type === 'deleted') {
            // Buscar informações de blame para a linha
            const blameInfo = line.type === 'added' ? this.blameInfo : this.blameInfoOld;
            const blameLine = blameInfo?.lines.find(bl => 
              Math.abs(bl.line_number - (hunk.new_start + index)) <= 2
            );

            if (blameLine) {
              const author = blameLine.author.name;
              if (!changes.has(author)) {
                changes.set(author, []);
              }
              
              changes.get(author)!.push({
                lineNumber: line.type === 'added' ? hunk.new_start + index : hunk.old_start + index,
                type: line.type,
                content: line.content,
                author: author
              });
            }
          }
        });
      }
    });

    // Converter para array
    changes.forEach((authorChanges, author) => {
      this.authorChanges.push(...authorChanges);
    });
  }

  onAuthorSelected(authorName?: string): void {
    if (authorName !== undefined) {
      this.selectedAuthor = authorName;
    }
    
    if (this.selectedAuthor) {
      this.authorChanges = this.authorChanges.filter(change => 
        change.author === this.selectedAuthor
      );
    } else {
      this.analyzeAuthorChanges();
    }
  }

  onBlameLoaded(type: 'old' | 'new', blameInfo: GitBlameInfo): void {
    if (type === 'old') {
      this.blameInfoOld = blameInfo;
    } else {
      this.blameInfo = blameInfo;
    }
    
    // Re-analisar mudanças quando blame for carregado
    if (this.blameInfo && this.blameInfoOld) {
      this.analyzeAuthorChanges();
    }
  }

  onLineClick(event: { lineNumber: number, blameInfo?: GitBlameLine }): void {
    console.log('Linha clicada:', event);
    if (event.blameInfo) {
      this.notificationService.showInfo(
        `Linha ${event.lineNumber} - Autor: ${event.blameInfo.author.name} (${event.blameInfo.commit_short_hash})`
      );
    }
  }

  onSideBySideLineClick(event: { side: 'left' | 'right', lineNumber: number, blameInfo?: GitBlameLine }): void {
    console.log('Side-by-side line clicked:', event);
    // Implementar lógica específica para o clique na visualização side-by-side
    if (event.blameInfo) {
      this.notificationService.showInfo(
        `Linha ${event.lineNumber} - Autor: ${event.blameInfo.author.name} (${event.blameInfo.commit_short_hash})`
      );
    }
  }

  toggleBlame(): void {
    this.showBlame = !this.showBlame;
    
    if (this.showBlame && !this.blameInfo && this.shouldLoadBlame()) {
      this.loadBlameInfo();
    }
  }

  get editorContent(): string {
    // Para o editor Monaco, usar o conteúdo novo do arquivo
    return this.fileComparison?.new_content || '';
  }
  get editorContentOld(): string {
    // Para o editor Monaco, usar o conteúdo antigo do arquivo
    return this.fileComparison?.old_content || '';
  }

  get editorLanguage(): string {
    // Mapear linguagens para Monaco Editor
    const languageMap: { [key: string]: string } = {
      'typescript': 'typescript',
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'csharp': 'csharp',
      'cpp': 'cpp',
      'c': 'c',
      'rust': 'rust',
      'go': 'go',
      'php': 'php',
      'ruby': 'ruby',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'yaml': 'yaml',
      'xml': 'xml',
      'markdown': 'markdown',
      'sql': 'sql',
      'shell': 'shell',
      'bash': 'shell',
      'plaintext': 'plaintext'
    };

    const detected = this.fileComparison?.language || 'plaintext';
    return languageMap[detected] || 'plaintext';
  }

  get uniqueAuthors(): Array<{name: string, count: number}> {
    if (!this.blameInfo && !this.blameInfoOld) return [];
    
    const authors = new Map<string, number>();
    
    // Contar autores na versão nova
    this.blameInfo?.lines.forEach(line => {
      const name = line.author.name;
      authors.set(name, (authors.get(name) || 0) + 1);
    });
    
    // Contar autores na versão antiga
    this.blameInfoOld?.lines.forEach(line => {
      const name = line.author.name;
      authors.set(name, (authors.get(name) || 0) + 1);
    });
    
    return Array.from(authors.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }
}
