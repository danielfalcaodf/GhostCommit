import { 
  Component, 
  Input, 
  OnInit, 
  OnDestroy, 
  ViewChild, 
  ElementRef, 
  Output, 
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { GitBlameInfo, GitBlameLine } from '../../models/git.models';

// Declare monaco globalmente (será carregado via CDN)
declare const monaco: any;

interface BlameDecoration {
  range: any;
  options: any;
  blameInfo: GitBlameLine;
}

@Component({
  selector: 'app-monaco-blame-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './monaco-blame-editor.component.html',
  styleUrls: ['./monaco-blame-editor.component.scss']
})
export class MonacoBlameEditorComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  @ViewChild('blamePanel', { static: true }) blamePanel!: ElementRef;

  @Input() content: string = '';
  @Input() language: string = 'plaintext';
  @Input() blameInfo?: GitBlameInfo;
  @Input() readonly: boolean = true;
  @Input() showBlame: boolean = true;
  @Input() theme: 'vs' | 'vs-dark' | 'hc-black' = 'vs-dark';
  @Input() fontSize: number = 14;
  @Input() wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded' = 'off';
  
  // Novas propriedades para comparação
  @Input() selectedAuthor: string = '';
  @Input() highlightChanges: boolean = false;
  @Input() changeType: 'old' | 'new' | 'both' = 'both';

  @Output() lineClick = new EventEmitter<{ lineNumber: number, blameInfo?: GitBlameLine }>();
  @Output() blameLoaded = new EventEmitter<GitBlameInfo>();
  @Output() authorSelected = new EventEmitter<string>();

  private editor: any = null;
  private blameDecorations: string[] = [];
  private resizeObserver?: ResizeObserver;

  // Estado do componente
  loading = false;
  error?: string;
  selectedLine?: number;
  hoverLine?: number;

  // Cache de autores para cores consistentes
  private authorColors = new Map<string, string>();
  private readonly authorColorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#F9CA24', '#F0932B',
    '#EB4D4B', '#6C5CE7', '#A29BFE', '#FD79A8', '#E17055',
    '#00B894', '#00CEC9', '#0984E3', '#6C5CE7', '#A29BFE'
  ];

  ngOnInit(): void {
    this.initializeMonaco();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.editor) {
      if (changes['content']) {
        this.updateEditorContent();
      }
      if (changes['language']) {
        this.updateEditorLanguage();
      }
      if (changes['blameInfo']) {
        this.updateBlameDecorations();
      }
      if (changes['selectedAuthor']) {
        this.updateAuthorHighlight();
      }
      if (changes['theme']) {
        monaco.editor.setTheme(this.theme);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.editor) {
      this.editor.dispose();
    }
  }

  private async initializeMonaco(): Promise<void> {
    try {
      this.loading = true;

      // Usar o loader CDN já incluído no index.html
      if ((window as any).require) {
        (window as any).require.config({
          paths: {
            'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
          }
        });

        (window as any).require(['vs/editor/editor.main'], () => {
          this.createEditor();
        });
      } else {
        // Fallback se não tiver require
        this.createEditor();
      }
    } catch (error) {
      console.error('Erro ao inicializar Monaco Editor:', error);
      this.error = 'Erro ao carregar o editor de código';
      this.loading = false;
    }
  }

  private createEditor(): void {
    try {

      // Configurar Monaco Editor
      monaco.editor.defineTheme('github-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'F97583' },
          { token: 'string', foreground: '9ECBFF' },
          { token: 'number', foreground: '79B8FF' },
          { token: 'type', foreground: 'B392F0' },
          { token: 'function', foreground: 'B392F0' },
          { token: 'variable', foreground: 'E1E4E8' },
        ],
        colors: {
          'editor.background': '#0D1117',
          'editor.foreground': '#E1E4E8',
          'editor.lineHighlightBackground': '#161B22',
          'editor.selectionBackground': '#264F78',
          'editorLineNumber.foreground': '#484F58',
          'editorLineNumber.activeForeground': '#E1E4E8',
        }
      });

      // Criar o editor
      this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
        value: this.content,
        language: this.language,
        theme: this.theme === 'vs-dark' ? 'github-dark' : this.theme,
        readOnly: this.readonly,
        fontSize: this.fontSize,
        wordWrap: this.wordWrap,
        lineNumbers: 'on',
        glyphMargin: true,
        folding: true,
        selectOnLineNumbers: true,
        automaticLayout: false,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        renderWhitespace: 'selection',
        lineDecorationsWidth: this.showBlame ? 200 : 10,
        lineNumbersMinChars: 4,
      });

      // Configurar eventos
      this.setupEditorEvents();

      // Configurar redimensionamento
      this.setupResizeObserver();

      // Aplicar blame se disponível
      if (this.blameInfo) {
        this.updateBlameDecorations();
      }

      this.loading = false;
    } catch (error) {
      console.error('Erro ao criar Monaco Editor:', error);
      this.error = 'Erro ao carregar o editor de código';
      this.loading = false;
    }
  }

  private setupEditorEvents(): void {
    if (!this.editor) return;

    // Click em linha
    this.editor.onMouseDown((e: any) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        const lineNumber = e.target.position?.lineNumber;
        if (lineNumber) {
          this.selectedLine = lineNumber;
          const blameInfo = this.getBlameForLine(lineNumber);
          this.lineClick.emit({ lineNumber, blameInfo });
        }
      }
    });

    // Hover em linha
    this.editor.onMouseMove((e: any) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS ||
          e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
        const lineNumber = e.target.position?.lineNumber;
        if (lineNumber !== this.hoverLine) {
          this.hoverLine = lineNumber;
          this.updateHoverDecorations();
        }
      }
    });

    // Mouse leave
    this.editor.onMouseLeave(() => {
      if (this.hoverLine) {
        this.hoverLine = undefined;
        this.updateHoverDecorations();
      }
    });
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.editor) {
          this.editor.layout();
        }
      });
      this.resizeObserver.observe(this.editorContainer.nativeElement);
    }
  }

  private updateEditorContent(): void {
    if (this.editor && this.content !== this.editor.getValue()) {
      this.editor.setValue(this.content);
    }
  }

  private updateEditorLanguage(): void {
    if (this.editor) {
      const model = this.editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, this.language);
      }
    }
  }

  private updateBlameDecorations(): void {
    if (!this.editor || !this.blameInfo || !this.showBlame) {
      return;
    }

    // Limpar decorações anteriores
    this.blameDecorations = this.editor.deltaDecorations(this.blameDecorations, []);

    const decorations: any[] = [];
    const model = this.editor.getModel();
    if (!model) return;

    this.blameInfo.lines.forEach((blameLine) => {
      const lineNumber = blameLine.line_number;
      const authorColor = this.getAuthorColor(blameLine.author.name);
      
      // Decoração da linha com informações de blame
      decorations.push({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'blame-glyph',
          glyphMarginHoverMessage: {
            value: this.createBlameTooltip(blameLine)
          },
          overviewRuler: {
            color: authorColor,
            position: monaco.editor.OverviewRulerLane.Left
          }
        }
      });

      // Decoração de borda lateral para indicar autoria
      decorations.push({
        range: new monaco.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
        options: {
          className: 'blame-line',
          beforeContentClassName: 'blame-line-indicator',
          marginClassName: 'blame-margin',
          inlineClassName: 'blame-inline'
        }
      });
    });

    this.blameDecorations = this.editor.deltaDecorations([], decorations);
    this.addBlameStyles();
  }

  private updateAuthorHighlight(): void {
    if (!this.editor || !this.blameInfo) {
      return;
    }

    // Limpar highlights anteriores
    this.blameDecorations = this.editor.deltaDecorations(this.blameDecorations, []);

    if (!this.selectedAuthor) {
      // Se não há autor selecionado, aplicar decorações normais
      this.updateBlameDecorations();
      return;
    }

    const decorations: any[] = [];
    const model = this.editor.getModel();
    if (!model) return;

    // Destacar linhas do autor selecionado com estilo mais proeminente
    this.blameInfo.lines.forEach((blameLine) => {
      const lineNumber = blameLine.line_number;
      const isSelectedAuthor = blameLine.author.name === this.selectedAuthor;
      
      if (isSelectedAuthor) {
        // Destaque forte para o autor selecionado
        decorations.push({
          range: new monaco.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
          options: {
            className: 'author-highlight-selected',
            backgroundColor: 'rgba(255, 193, 7, 0.25)',
            borderColor: '#ffc107',
            borderWidth: '2px 0 2px 4px',
            borderStyle: 'solid',
            marginClassName: 'author-highlight-margin',
            glyphMarginClassName: 'author-highlight-glyph'
          }
        });

        // Decoração adicional para a numeração da linha
        decorations.push({
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: {
            glyphMarginClassName: 'selected-author-glyph',
            glyphMarginHoverMessage: {
              value: `**${blameLine.author.name}** - Linha selecionada\n\n${this.createBlameTooltip(blameLine)}`
            }
          }
        });
      } else {
        // Estilo mais suave para outros autores
        const authorColor = this.getAuthorColor(blameLine.author.name);
        decorations.push({
          range: new monaco.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber)),
          options: {
            className: 'author-other-line',
            backgroundColor: 'rgba(128, 128, 128, 0.05)',
            glyphMarginClassName: 'blame-glyph-dimmed',
            glyphMarginHoverMessage: {
              value: this.createBlameTooltip(blameLine)
            }
          }
        });
      }
    });

    // Aplicar decorações
    this.blameDecorations = this.editor.deltaDecorations([], decorations);
    
    // Adicionar estilos CSS específicos
    this.addEnhancedAuthorHighlightStyles();
  }

  private clearAuthorHighlight(): void {
    if (this.editor) {
      this.blameDecorations = this.editor.deltaDecorations(this.blameDecorations, []);
    }
  }

  private addAuthorHighlightStyles(): void {
    const styleId = 'author-highlight-styles';
    let existingStyle = document.getElementById(styleId);
    
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    
    style.textContent = `
      .author-highlight-line {
        background-color: rgba(255, 193, 7, 0.15) !important;
        border-left: 4px solid #ffc107 !important;
        animation: highlightPulse 2s ease-in-out;
      }
      
      @keyframes highlightPulse {
        0% { background-color: rgba(255, 193, 7, 0.3); }
        50% { background-color: rgba(255, 193, 7, 0.15); }
        100% { background-color: rgba(255, 193, 7, 0.15); }
      }
      
      .author-highlight-line .blame-glyph {
        background-color: #ffc107 !important;
        box-shadow: 0 0 4px rgba(255, 193, 7, 0.6);
      }
    `;

    document.head.appendChild(style);
  }

  private addBlameStyles(): void {
    if (!this.blameInfo) return;

    // Criar estilos CSS dinamicamente para cada autor
    const styleId = 'blame-styles';
    let existingStyle = document.getElementById(styleId);
    
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    
    let css = `
      .blame-glyph {
        width: 8px !important;
        height: 100%;
        border-radius: 2px;
        margin-left: 2px;
      }
      
      .blame-line {
        border-left: 3px solid transparent;
        padding-left: 5px;
      }
      
      .blame-hover-line {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .blame-margin {
        width: 200px;
        background-color: rgba(0, 0, 0, 0.1);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
      }
    `;

    // Estilos específicos por autor
    this.blameInfo.lines.forEach(blameLine => {
      const authorColor = this.getAuthorColor(blameLine.author.name);
      const sanitizedAuthor = blameLine.author.name.replace(/[^a-zA-Z0-9]/g, '_');
      
      css += `
        .blame-author-${sanitizedAuthor} .blame-glyph {
          background-color: ${authorColor} !important;
        }
        
        .blame-author-${sanitizedAuthor} .blame-line {
          border-left-color: ${authorColor} !important;
        }
      `;
    });

    style.textContent = css;
    document.head.appendChild(style);
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

  public getBlameForLine(lineNumber: number): GitBlameLine | undefined {
    return this.blameInfo?.lines.find(line => line.line_number === lineNumber);
  }

  private getAuthorColor(authorName: string): string {
    if (!this.authorColors.has(authorName)) {
      const colorIndex = this.authorColors.size % this.authorColorPalette.length;
      this.authorColors.set(authorName, this.authorColorPalette[colorIndex]);
    }
    return this.authorColors.get(authorName)!;
  }

  // Métodos públicos para controle externo
  public layout(): void {
    if (this.editor) {
      this.editor.layout();
    }
  }

  public goToLine(lineNumber: number): void {
    if (this.editor) {
      this.editor.revealLine(lineNumber);
      this.editor.setPosition({ lineNumber, column: 1 });
      this.selectedLine = lineNumber;
    }
  }

  public getContent(): string {
    return this.editor?.getValue() || '';
  }

  public setContent(content: string): void {
    if (this.editor) {
      this.editor.setValue(content);
    }
  }

  public toggleBlame(): void {
    this.showBlame = !this.showBlame;
    if (this.showBlame && this.blameInfo) {
      this.updateBlameDecorations();
    } else {
      this.blameDecorations = this.editor?.deltaDecorations(this.blameDecorations, []) || [];
    }
  }

  public getSelectedText(): string {
    if (!this.editor) return '';
    const selection = this.editor.getSelection();
    if (!selection) return '';
    return this.editor.getModel()?.getValueInRange(selection) || '';
  }

  // Getters para template
  get authorStats() {
    if (!this.blameInfo) return [];
    
    const stats = new Map<string, { count: number, color: string, email: string }>();
    
    this.blameInfo.lines.forEach(line => {
      const author = line.author.name;
      if (stats.has(author)) {
        stats.get(author)!.count++;
      } else {
        stats.set(author, {
          count: 1,
          color: this.getAuthorColor(author),
          email: line.author.email
        });
      }
    });
    
    return Array.from(stats.entries()).map(([name, data]) => ({
      name,
      ...data,
      percentage: Math.round((data.count / this.blameInfo!.lines.length) * 100)
    })).sort((a, b) => b.count - a.count);
  }

  private updateHoverDecorations(): void {
    if (!this.editor || !this.hoverLine) return;

    const blameInfo = this.getBlameForLine(this.hoverLine);
    if (!blameInfo) return;

    // Adicionar tooltip visual para linha em hover
    const decorations: any[] = [{
      range: new monaco.Range(this.hoverLine, 1, this.hoverLine, 1),
      options: {
        className: 'blame-hover-line',
        hoverMessage: {
          value: this.createBlameTooltip(blameInfo)
        }
      }
    }];

    // Aplicar temporariamente
    const hoverDecorations = this.editor.deltaDecorations([], decorations);
    
    // Remover após um tempo
    setTimeout(() => {
      if (this.editor) {
        this.editor.deltaDecorations(hoverDecorations, []);
      }
    }, 100);
  }

  public  onAuthorClick(authorName: string): void {
    if (this.selectedAuthor === authorName) {
      // Se já está selecionado, desselecionar
      this.selectedAuthor = '';
      this.clearAuthorHighlight();
    } else {
      // Selecionar novo autor
      this.selectedAuthor = authorName;
      this.updateAuthorHighlight();
      
      // Focar na primeira linha do autor com um pequeno delay para a animação
      setTimeout(() => {
        this.focusOnAuthorLines();
      }, 300);
    }
    
    // Emitir evento para componente pai
    this.authorSelected.emit(this.selectedAuthor);
  }

  private addEnhancedAuthorHighlightStyles(): void {
    const styleId = 'enhanced-author-highlight-styles';
    let existingStyle = document.getElementById(styleId);
    
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    
    style.textContent = `
      .author-highlight-selected {
        background-color: rgba(255, 193, 7, 0.25) !important;
        border-left: 4px solid #ffc107 !important;
        animation: highlightPulse 1.5s ease-in-out;
        position: relative;
      }
      
      .author-highlight-selected::before {
        content: '';
        position: absolute;
        left: -4px;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(to bottom, #ffc107, #ff8f00);
        box-shadow: 0 0 8px rgba(255, 193, 7, 0.6);
      }
      
      .author-other-line {
        background-color: rgba(128, 128, 128, 0.05) !important;
        opacity: 0.6;
        transition: all 0.3s ease;
      }
      
      .selected-author-glyph {
        background-color: #ffc107 !important;
        border-radius: 50% !important;
        width: 8px !important;
        height: 8px !important;
        margin: 4px !important;
        box-shadow: 0 0 6px rgba(255, 193, 7, 0.8);
        animation: pulse 2s infinite;
      }
      
      .blame-glyph-dimmed {
        opacity: 0.4;
        width: 4px !important;
        height: 4px !important;
        margin: 6px !important;
        border-radius: 2px;
      }
      
      .author-highlight-margin {
        background-color: rgba(255, 193, 7, 0.1) !important;
        border-right: 1px solid rgba(255, 193, 7, 0.3);
      }
      
      @keyframes highlightPulse {
        0% { background-color: rgba(255, 193, 7, 0.4); }
        50% { background-color: rgba(255, 193, 7, 0.25); }
        100% { background-color: rgba(255, 193, 7, 0.25); }
      }
      
      @keyframes pulse {
        0% { 
          transform: scale(1);
          box-shadow: 0 0 6px rgba(255, 193, 7, 0.8);
        }
        50% { 
          transform: scale(1.2);
          box-shadow: 0 0 10px rgba(255, 193, 7, 1);
        }
        100% { 
          transform: scale(1);
          box-shadow: 0 0 6px rgba(255, 193, 7, 0.8);
        }
      }
    `;

    document.head.appendChild(style);
  }

  public focusOnAuthorLines(): void {
    if (!this.editor || !this.blameInfo || !this.selectedAuthor) return;

    // Encontrar a primeira linha do autor selecionado
    const firstAuthorLine = this.blameInfo.lines.find(line => 
      line.author.name === this.selectedAuthor
    );

    if (firstAuthorLine) {
      // Revelar e centralizar na primeira linha do autor
      this.editor.revealLineInCenter(firstAuthorLine.line_number);
      this.editor.setPosition({ 
        lineNumber: firstAuthorLine.line_number, 
        column: 1 
      });
    }
  }
}
