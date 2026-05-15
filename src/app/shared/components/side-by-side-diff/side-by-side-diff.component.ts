import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, ViewChild, ElementRef, SimpleChanges, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';

// Models
import { GitFileComparison, GitDiffHunk, GitDiffLine, GitBlameInfo, GitBlameLine } from '../../models';
import { EnhancedDiffStatsComponent } from '../enhanced-diff-stats/enhanced-diff-stats.component';

// Monaco Editor types
declare const monaco: any;
declare const require: any;

interface DiffEditorConfig {
  theme: 'vs-dark' | 'vs-light';
  fontSize: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  renderSideBySide: boolean;
  ignoreTrimWhitespace: boolean;
  renderWhitespace: 'all' | 'boundary' | 'selection' | 'trailing' | 'none';
}

interface DiffHighlight {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
  className: string;
  type: 'addition' | 'deletion' | 'modification';
}

@Component({
  selector: 'app-side-by-side-diff',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatChipsModule,
    EnhancedDiffStatsComponent
  ],
  templateUrl: './side-by-side-diff.component.html',
  styleUrls: ['./side-by-side-diff.component.scss']
})
export class SideBySideDiffComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() fileComparison: GitFileComparison | null = null;
  @Input() leftRef: string = '';
  @Input() rightRef: string = '';
  @Input() fileName: string = '';
  @Input() language: string = 'plaintext';
  @Input() showStats: boolean = true;
  @Input() showHeader: boolean = true;
  @Input() showBlameInfo: boolean = false;
  @Input() theme: 'vs-dark' | 'vs-light' = 'vs-dark';
  @Input() fontSize: number = 14;
  @Input() readonly: boolean = true;
  @Input() leftBlameInfo: GitBlameInfo | undefined;
  @Input() rightBlameInfo: GitBlameInfo | undefined;
  @Output() lineClick = new EventEmitter<{ side: 'left' | 'right', lineNumber: number, blameInfo: GitBlameLine | undefined }>();
  @Output() scrollSync = new EventEmitter<{ side: 'left' | 'right', scrollTop: number }>();

  @ViewChild('diffEditorContainer', { static: false }) diffEditorContainer!: ElementRef;

  private destroy$ = new Subject<void>();
  private diffEditor: any;
  private isEditorReady = false;

  // Component state
  loading = false;
  error: string | null = null;
  private _hasChanges = false;
  
  // Configuration
  config: DiffEditorConfig = {
    theme: 'vs-dark',
    fontSize: 14,
    wordWrap: true,
    showLineNumbers: true,
    renderSideBySide: true,
    ignoreTrimWhitespace: true,
    renderWhitespace: 'boundary'
  };

  // Diff highlights
  leftHighlights: DiffHighlight[] = [];
  rightHighlights: DiffHighlight[] = [];

  // Content
  leftContent: string = '';
  rightContent: string = '';
  rightHoverLine?: number;
  leftHoverLine?: number;
  private _rightHoverDecoration: string[] = [];
  private _leftHoverDecoration: string[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initializeConfig();
  }

  ngAfterViewInit(): void {
    // Aguardar o próximo ciclo para evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.initializeEditor();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fileComparison'] && this.fileComparison) {
      this.processFileComparison();
    }

    if (changes['theme'] && this.isEditorReady) {
      this.config.theme = this.theme;
      this.updateEditorTheme();
    }

    if (changes['fontSize'] && this.isEditorReady) {
      this.config.fontSize = this.fontSize;
      this.updateEditorFontSize();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disposeEditor();
  }

  private initializeConfig(): void {
    this.config = {
      ...this.config,
      theme: this.theme,
      fontSize: this.fontSize
    };
  }

  public async initializeEditor(): Promise<void> {
    if (!this.diffEditorContainer) return;

    try {
      this.loading = true;
      this.error = null;
      this.cdr.detectChanges();

      // Aguardar Monaco Editor estar disponível
      await this.waitForMonaco();

      // Criar o diff editor
      this.createDiffEditor();

    } catch (error) {
      console.error('Erro ao inicializar editor:', error);
      this.error = 'Erro ao carregar o editor de diferenças';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private async waitForMonaco(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (typeof monaco !== 'undefined') {
        resolve();
        return;
      }

      // Usar o loader do Monaco
      const loader = (window as any).require;
      if (loader) {
        loader.config({ 
          paths: { 
            vs: 'https://unpkg.com/monaco-editor@0.52.2/min/vs' 
          } 
        });
        
        loader(['vs/editor/editor.main'], () => {
          resolve();
        }, (err: any) => {
          reject(err);
        });
        return;
      }

      // Fallback: aguardar Monaco estar disponível
      let attempts = 0;
      const maxAttempts = 100; // Aumentar tentativas
      const checkInterval = setInterval(() => {
        attempts++;
        if (typeof monaco !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error('Monaco Editor não pôde ser carregado'));
        }
      }, 100);
    });
  }

  private createDiffEditor(): void {
    try {
      // Verificar se Monaco está disponível
      if (typeof monaco === 'undefined') {
        throw new Error('Monaco Editor não está disponível');
      }

      // Criar o diff editor
      this.diffEditor = monaco.editor.createDiffEditor(
        this.diffEditorContainer.nativeElement,
        {
          theme: this.config.theme,
          fontSize: this.config.fontSize,
          wordWrap: this.config.wordWrap ? 'on' : 'off',
          lineNumbers: this.config.showLineNumbers ? 'on' : 'off',
          renderSideBySide: this.config.renderSideBySide,
          ignoreTrimWhitespace: this.config.ignoreTrimWhitespace,
          renderWhitespace: this.config.renderWhitespace,
          readOnly: this.readonly,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          contextmenu: false,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 4,
          glyphMargin: false,
          folding: false,
          renderOverviewRuler: false,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            verticalScrollbarSize: 12,
            horizontalScrollbarSize: 12
          }
        }
      );

      // Configurar eventos
      this.setupEditorEvents();
      
      // Marcar como pronto e atualizar estado
      this.isEditorReady = true;
      this.loading = false;
      
      // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.cdr.detectChanges();
        
        // Processar conteúdo se já disponível
        if (this.fileComparison) {
          this.processFileComparison();
        }
      }, 0);

    } catch (error) {
      console.error('Erro ao criar diff editor:', error);
      this.error = 'Erro ao criar o editor de diferenças';
      this.loading = false;
      
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
    }
  }

  private setupEditorEvents(): void {
    if (!this.diffEditor) return;

    // Evento de clique em linha
    const modifiedEditor = this.diffEditor.getModifiedEditor();
    const originalEditor = this.diffEditor.getOriginalEditor();

    if (modifiedEditor) {
      modifiedEditor.onMouseDown((e: any) => {
        if (e.target.position) {
          this.lineClick.emit({
            side: 'right',
            lineNumber: e.target.position.lineNumber,
            blameInfo: this.getBlameForLine(e.target.position.lineNumber, true)
          });
        }
      });
    }

    if (originalEditor) {
      originalEditor.onMouseDown((e: any) => {
        if (e.target.position) {
          this.lineClick.emit({
            side: 'left',
            lineNumber: e.target.position.lineNumber,
            blameInfo: this.getBlameForLine(e.target.position.lineNumber, false)
          });
        }
      });
    }

    // Sincronização de scroll
    if (modifiedEditor && originalEditor) {
      modifiedEditor.onDidScrollChange((e: any) => {
        this.scrollSync.emit({
          side: 'right',
          scrollTop: e.scrollTop
        });
      });

      originalEditor.onDidScrollChange((e: any) => {
        this.scrollSync.emit({
          side: 'left',
          scrollTop: e.scrollTop
        });
      });
    }
    if (modifiedEditor) {
      
      modifiedEditor.onMouseMove((e: any) => {
       if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS ||
           e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
         const lineNumber = e.target.position?.lineNumber;
         console.log(`Mouse moved on modified editor at line: ${lineNumber}`);
         if (lineNumber !== this.rightHoverLine) {
          this.rightHoverLine = lineNumber;
          this.updateHoverDecorations(modifiedEditor, true);
        }
         
       }
     });
    }
    if (originalEditor) {

      originalEditor.onMouseMove((e: any) => {
       if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS ||
           e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
         const lineNumber = e.target.position?.lineNumber;
         console.log(`Mouse moved on original editor at line: ${lineNumber}`);
         if (lineNumber !== this.leftHoverLine) {
           this.leftHoverLine = lineNumber;
           this.updateHoverDecorations( originalEditor);
         }
       }
     });
    }

  }

  updateHoverDecorations(editor: any = null, isRight = false): void {
    if (!editor) return;
    if (isRight && this.rightHoverLine == null) return;
    if (!isRight && this.leftHoverLine == null) return;
    const hoverLine = isRight ? this.rightHoverLine : this.leftHoverLine;
    const blameInfo = this.getBlameForLine(hoverLine!, isRight);
    if (!blameInfo) return;

    // Usar o tipo correto para hoverMessage (array de IMarkdownString)
    const decorations: any[] = [{
      range: new monaco.Range(hoverLine!, 1, hoverLine!, 1),
      options: {
        className: 'blame-hover-line',
        hoverMessage: [{ value: this.createBlameTooltip(blameInfo) }]
      }
    }];

    // Guardar o id da decoração para remover depois
    if (isRight) {
      if (this._rightHoverDecoration && this._rightHoverDecoration.length) {
        editor.deltaDecorations(this._rightHoverDecoration, []);
      }
      this._rightHoverDecoration = editor.deltaDecorations([], decorations);
    } else {
      if (this._leftHoverDecoration && this._leftHoverDecoration.length) {
        editor.deltaDecorations(this._leftHoverDecoration, []);
      }
      this._leftHoverDecoration = editor.deltaDecorations([], decorations);
    }
  }
 
  private createBlameTooltip(blameLine: GitBlameLine): string {
    const date = new Date(blameLine.date).toLocaleString('pt-BR');
    return `
**${blameLine.author.name}** (${blameLine.author.email})  
**Commit:** \`${blameLine.commit_short_hash}\`  
**Data:** ${date}  
**Mensagem:** ${blameLine.message.split('\n')[0] || 'Sem mensagem'}
    `.trim();
  }

  public getBlameForLine(lineNumber: number, isRight: boolean = false): GitBlameLine | undefined {
    return isRight ? this.rightBlameInfo?.lines.find(line => line.line_number === lineNumber) : this.leftBlameInfo?.lines.find(line => line.line_number === lineNumber);
  }
  private processFileComparison(): void {
    if (!this.fileComparison || !this.isEditorReady) return;

    setTimeout(() => {
      try {
        // Extrair conteúdo das versões
        this.leftContent = this.fileComparison?.old_content || '';
        this.rightContent = this.fileComparison?.new_content || '';

        // Definir modelos para o diff editor
        const originalModel = monaco.editor.createModel(
          this.leftContent,
          this.getMonacoLanguage(),
          monaco.Uri.file(`${this.fileName}.original`)
        );

        const modifiedModel = monaco.editor.createModel(
          this.rightContent,
          this.getMonacoLanguage(),
          monaco.Uri.file(`${this.fileName}.modified`)
        );

        // Configurar o diff editor
        this.diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel
        });

        // Processar highlights das diferenças
        this.processHunkHighlights();
        
        // Forçar detecção de mudanças
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Erro ao processar comparação de arquivo:', error);
      }
    }, 0);
  }

  private processHunkHighlights(): void {
    if (!this.fileComparison?.diff?.hunks) {
      this._hasChanges = false;
      return;
    }

    this.leftHighlights = [];
    this.rightHighlights = [];

    this.fileComparison.diff.hunks.forEach(hunk => {
      this.processHunkLines(hunk);
    });

    // Aplicar decorações
    this.applyEditorDecorations();
    
    // Atualizar estado de mudanças
    this._hasChanges = this.leftHighlights.length > 0 || this.rightHighlights.length > 0;
  }

  private processHunkLines(hunk: GitDiffHunk): void {
    if (!hunk.lines) return;

    let oldLineNumber = hunk.old_start;
    let newLineNumber = hunk.new_start;

    hunk.lines.forEach(line => {
      switch (line.type) {
        case 'deleted':
          this.leftHighlights.push({
            startLineNumber: oldLineNumber,
            endLineNumber: oldLineNumber,
            startColumn: 1,
            endColumn: Number.MAX_VALUE,
            className: 'diff-line-deleted',
            type: 'deletion'
          });
          oldLineNumber++;
          break;

        case 'added':
          this.rightHighlights.push({
            startLineNumber: newLineNumber,
            endLineNumber: newLineNumber,
            startColumn: 1,
            endColumn: Number.MAX_VALUE,
            className: 'diff-line-added',
            type: 'addition'
          });
          newLineNumber++;
          break;

        case 'context':
          oldLineNumber++;
          newLineNumber++;
          break;
      }
    });
  }

  private applyEditorDecorations(): void {
    if (!this.diffEditor || !this.isEditorReady) return;

    const originalEditor = this.diffEditor.getOriginalEditor();
    const modifiedEditor = this.diffEditor.getModifiedEditor();

    // Aplicar decorações no editor original (esquerda)
    if (originalEditor && this.leftHighlights.length > 0) {
      const leftDecorations = this.leftHighlights.map(highlight => ({
        range: new monaco.Range(
          highlight.startLineNumber,
          highlight.startColumn,
          highlight.endLineNumber,
          highlight.endColumn
        ),
        options: {
          className: highlight.className,
          isWholeLine: true,
          marginClassName: 'diff-gutter-deleted'
        }
      }));

      originalEditor.deltaDecorations([], leftDecorations);
    }

    // Aplicar decorações no editor modificado (direita)
    if (modifiedEditor && this.rightHighlights.length > 0) {
      const rightDecorations = this.rightHighlights.map(highlight => ({
        range: new monaco.Range(
          highlight.startLineNumber,
          highlight.startColumn,
          highlight.endLineNumber,
          highlight.endColumn
        ),
        options: {
          className: highlight.className,
          isWholeLine: true,
          marginClassName: 'diff-gutter-added'
        }
      }));

      modifiedEditor.deltaDecorations([], rightDecorations);
    }
  }

  private getMonacoLanguage(): string {
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

    return languageMap[this.language.toLowerCase()] || 'plaintext';
  }

  private updateEditorTheme(): void {
    if (!this.diffEditor) return;
    monaco.editor.setTheme(this.config.theme);
  }

  private updateEditorFontSize(): void {
    if (!this.diffEditor) return;
    this.diffEditor.updateOptions({ fontSize: this.config.fontSize });
  }

  private disposeEditor(): void {
    if (this.diffEditor) {
      this.diffEditor.dispose();
      this.diffEditor = null;
    }
    this.isEditorReady = false;
  }

  // Public methods
  public layout(): void {
    if (this.diffEditor && this.isEditorReady) {
      this.diffEditor.layout();
    }
  }

  public goToLine(lineNumber: number, side: 'left' | 'right' = 'right'): void {
    if (!this.diffEditor || !this.isEditorReady) return;

    const editor = side === 'left' 
      ? this.diffEditor.getOriginalEditor()
      : this.diffEditor.getModifiedEditor();

    if (editor) {
      editor.revealLineInCenter(lineNumber);
      editor.setPosition({ lineNumber, column: 1 });
    }
  }

  public toggleSideBySide(): void {
    if (!this.diffEditor) return;
    
    this.config.renderSideBySide = !this.config.renderSideBySide;
    this.diffEditor.updateOptions({
      renderSideBySide: this.config.renderSideBySide
    });
  }

  public toggleWordWrap(): void {
    if (!this.diffEditor) return;
    
    this.config.wordWrap = !this.config.wordWrap;
    this.diffEditor.updateOptions({
      wordWrap: this.config.wordWrap ? 'on' : 'off'
    });
  }

  // Getters
  get hasChanges(): boolean {
    return this._hasChanges;
  }

  get totalAdditions(): number {
    return this.rightHighlights.filter(h => h.type === 'addition').length;
  }

  get totalDeletions(): number {
    return this.leftHighlights.filter(h => h.type === 'deletion').length;
  }

  get isSideBySide(): boolean {
    return this.config.renderSideBySide;
  }
}
