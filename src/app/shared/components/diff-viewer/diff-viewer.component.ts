import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Models
import { GitFileComparison, GitDiffHunk, GitDiffLine, GitBlameInfo } from '../../models';
import { GitService } from '../../../core/services/git.service';

// Monaco Editor types
declare const monaco: any;

interface BlameTooltipData {
  visible: boolean;
  x: number;
  y: number;
  blameInfo: GitBlameInfo | null;
}

@Component({
  selector: 'app-diff-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSlideToggleModule
  ],
  templateUrl: './diff-viewer.component.html',
  styleUrls: ['./diff-viewer.component.scss']
})
export class DiffViewerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() fileComparison: GitFileComparison | null = null;
  @Input() repository: any = null; // GitRepository
  @Input() commitA: string = '';
  @Input() commitB: string = '';
  @Input() fromCommit: string = '';
  @Input() toCommit: string = '';
  @Input() showBlame: boolean = false;
  @Output() fileChanged = new EventEmitter<string>();

  @ViewChild('unifiedEditor', { static: false }) unifiedEditorRef!: ElementRef;
  @ViewChild('originalEditor', { static: false }) originalEditorRef!: ElementRef;
  @ViewChild('modifiedEditor', { static: false }) modifiedEditorRef!: ElementRef;

  private destroy$ = new Subject<void>();
  private unifiedEditor: any;
  private originalEditor: any;
  private modifiedEditor: any;

  // State
  loading = false;
  selectedTab = 0;
  wrapText = false;
  showWhitespace = false;

  // Blame tooltip
  blameTooltip: BlameTooltipData = {
    visible: false,
    x: 0,
    y: 0,
    blameInfo: null
  };

  constructor(private gitService: GitService) {}

  ngOnInit() {
    // Monaco Editor será inicializado quando as tabs mudarem
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.disposeEditors();
  }

  ngOnChanges() {
    if (this.fileComparison) {
      this.updateEditors();
    }
  }

  private async updateEditors() {
    if (!this.fileComparison) return;

    setTimeout(() => {
      this.initializeEditors();
    }, 100);
  }

  private initializeEditors() {
    if (typeof monaco === 'undefined') {
      console.warn('Monaco Editor não está disponível');
      return;
    }

    this.disposeEditors();

    if (this.selectedTab === 0 && this.unifiedEditorRef) {
      this.initUnifiedEditor();
    } else if (this.selectedTab === 1 && this.originalEditorRef && this.modifiedEditorRef) {
      this.initSideBySideEditors();
    }
  }

  private initUnifiedEditor() {
    const unifiedDiff = this.createUnifiedDiff();
    
    this.unifiedEditor = monaco.editor.create(this.unifiedEditorRef.nativeElement, {
      value: unifiedDiff,
      language: this.getLanguage(),
      theme: 'vs-dark',
      readOnly: true,
      automaticLayout: true,
      wordWrap: this.wrapText ? 'on' : 'off',
      renderWhitespace: this.showWhitespace ? 'all' : 'none',
      lineNumbers: 'on',
      minimap: { enabled: false }
    });
  }

  private initSideBySideEditors() {
    const originalContent = this.fileComparison?.oldContent || '';
    const modifiedContent = this.fileComparison?.newContent || '';
    const language = this.getLanguage();

    this.originalEditor = monaco.editor.create(this.originalEditorRef.nativeElement, {
      value: originalContent,
      language: language,
      theme: 'vs-dark',
      readOnly: true,
      automaticLayout: true,
      wordWrap: this.wrapText ? 'on' : 'off',
      renderWhitespace: this.showWhitespace ? 'all' : 'none'
    });

    this.modifiedEditor = monaco.editor.create(this.modifiedEditorRef.nativeElement, {
      value: modifiedContent,
      language: language,
      theme: 'vs-dark',
      readOnly: true,
      automaticLayout: true,
      wordWrap: this.wrapText ? 'on' : 'off',
      renderWhitespace: this.showWhitespace ? 'all' : 'none'
    });
  }

  private disposeEditors() {
    if (this.unifiedEditor) {
      this.unifiedEditor.dispose();
      this.unifiedEditor = null;
    }
    if (this.originalEditor) {
      this.originalEditor.dispose();
      this.originalEditor = null;
    }
    if (this.modifiedEditor) {
      this.modifiedEditor.dispose();
      this.modifiedEditor = null;
    }
  }

  private createUnifiedDiff(): string {
    if (!this.fileComparison) return '';

    let diff = `--- a/${this.fileComparison.file.path}\n+++ b/${this.fileComparison.file.path}\n`;
    
    this.fileComparison.hunks.forEach(hunk => {
      diff += `${hunk.header}\n`;
      hunk.lines.forEach(line => {
        const prefix = this.getLinePrefix(line.type);
        diff += `${prefix}${line.content}\n`;
      });
    });

    return diff;
  }

  private getLanguage(): string {
    if (!this.fileComparison) return 'plaintext';
    return this.gitService.detectLanguage(this.fileComparison.file.path);
  }

  onTabChanged(index: number) {
    this.selectedTab = index;
    setTimeout(() => {
      this.initializeEditors();
    }, 100);
  }

  toggleBlame() {
    // Implementar toggle de blame
    if (this.showBlame) {
      // Carregar informações de blame
      this.loadBlameInfo();
    }
  }

  toggleWordWrap() {
    // Atualizar configuração de word wrap nos editores
    this.updateEditorOptions();
  }

  toggleWhitespace() {
    // Atualizar configuração de whitespace nos editores
    this.updateEditorOptions();
  }

  private updateEditorOptions() {
    const options = {
      wordWrap: this.wrapText ? 'on' : 'off',
      renderWhitespace: this.showWhitespace ? 'all' : 'none'
    };

    if (this.unifiedEditor) {
      this.unifiedEditor.updateOptions(options);
    }
    if (this.originalEditor) {
      this.originalEditor.updateOptions(options);
    }
    if (this.modifiedEditor) {
      this.modifiedEditor.updateOptions(options);
    }
  }

  private loadBlameInfo() {
    if (!this.fileComparison) return;

    // Implementar carregamento de blame info via GitService
    // this.gitService.getFileBlame(this.fileComparison.file.path).subscribe(...)
  }

  showBlameTooltip(event: MouseEvent, line: GitDiffLine) {
    if (!this.showBlame || !line.blameInfo) return;

    this.blameTooltip = {
      visible: true,
      x: event.clientX + 10,
      y: event.clientY - 10,
      blameInfo: line.blameInfo
    };
  }

  hideBlameTooltip() {
    this.blameTooltip.visible = false;
  }

  getBlameTooltip(line: GitDiffLine): string {
    if (!this.showBlame || !line.blameInfo) return '';
    
    const blame = line.blameInfo;
    return `Commit: ${blame.commit.substring(0, 8)}\nAutor: ${blame.author}\nData: ${this.formatDate(blame.date)}\nMensagem: ${blame.message}`;
  }

  downloadDiff() {
    if (!this.fileComparison) return;

    const diff = this.createUnifiedDiff();
    const blob = new Blob([diff], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `${this.fileComparison.file.path.replace(/[/\\]/g, '_')}.diff`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getFileIcon(): string {
    if (!this.fileComparison) return 'description';
    return this.gitService.detectLanguage(this.fileComparison.file.path) === 'plaintext' 
      ? 'description' 
      : 'code';
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'added': return 'Adicionado';
      case 'deleted': return 'Removido';
      case 'modified': return 'Modificado';
      case 'renamed': return 'Renomeado';
      case 'copied': return 'Copiado';
      default: return status;
    }
  }

  getLinePrefix(type: string): string {
    switch (type) {
      case 'addition': return '+';
      case 'deletion': return '-';
      default: return ' ';
    }
  }

  getHunkAdditions(hunk: GitDiffHunk): number {
    return hunk.lines.filter(line => line.type === 'addition').length;
  }

  getHunkDeletions(hunk: GitDiffHunk): number {
    return hunk.lines.filter(line => line.type === 'deletion').length;
  }

  highlightSyntax(content: string): string {
    // Implementação básica de highlight
    // Em produção, usar uma biblioteca como Prism.js ou highlight.js
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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

  trackHunk(index: number, hunk: GitDiffHunk): string {
    return hunk.header;
  }

  trackLine(index: number, line: GitDiffLine): string {
    return `${line.type}-${line.oldLineNumber}-${line.newLineNumber}`;
  }
}
