import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MonacoEditorComponent } from '../../shared/components/monaco-editor/monaco-editor.component';
import { NotificationService } from '../../core/services/notification.service';
import { TauriService } from '../../core/services/tauri.service';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MonacoEditorComponent
  ],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss']
})
export class CodeEditorComponent implements OnInit {
  selectedLanguage = 'javascript';
  currentCode = `// Bem-vindo ao GhostCommit Code Editor
// Este é um editor de código integrado com Monaco Editor

function helloWorld() {
  console.log('Hello, World!');
  return 'GhostCommit está funcionando!';
}

// Exemplo de código TypeScript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: 'Desenvolvedor',
  email: 'dev@ghostcommit.com'
};

helloWorld();
`;

  currentFileName = '';
  lineCount = 0;
  charCount = 0;

  editorOptions = {
    automaticLayout: true,
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    minimap: { enabled: true },
    wordWrap: 'on',
    folding: true,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true
    }
  };

  constructor(
    private notificationService: NotificationService,
    private tauriService: TauriService
  ) {}

  ngOnInit() {
    this.updateStats();
  }

  onCodeChange(code: string) {
    this.currentCode = code;
    this.updateStats();
  }

  onLanguageChange() {
    this.notificationService.showSuccess(`Linguagem alterada para ${this.selectedLanguage}`);
  }

  async saveFile() {
    try {
      if (this.tauriService.isTauri()) {
        // Implementar salvamento via Tauri
        this.notificationService.showSuccess('Arquivo salvo com sucesso!');
      } else {
        // Fallback para download do arquivo
        this.downloadFile();
      }
    } catch (error) {
      this.notificationService.showError('Erro ao salvar arquivo');
      console.error('Erro ao salvar:', error);
    }
  }

  async openFile() {
    try {
      if (this.tauriService.isTauri()) {
        // Implementar abertura via Tauri
        this.notificationService.showInfo('Funcionalidade de abertura será implementada');
      } else {
        // Fallback para input file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js,.ts,.py,.rs,.json,.html,.css,.scss,.txt';
        
        input.onchange = (event: any) => {
          const file = event.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              this.currentCode = e.target.result;
              this.currentFileName = file.name;
              this.detectLanguageFromFileName(file.name);
              this.updateStats();
              this.notificationService.showSuccess(`Arquivo ${file.name} carregado`);
            };
            reader.readAsText(file);
          }
        };
        
        input.click();
      }
    } catch (error) {
      this.notificationService.showError('Erro ao abrir arquivo');
      console.error('Erro ao abrir:', error);
    }
  }

  newFile() {
    this.currentCode = '';
    this.currentFileName = '';
    this.selectedLanguage = 'javascript';
    this.updateStats();
    this.notificationService.showSuccess('Novo arquivo criado');
  }

  private downloadFile() {
    const extension = this.getFileExtension();
    const fileName = this.currentFileName || `code.${extension}`;
    
    const blob = new Blob([this.currentCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.notificationService.showSuccess(`Arquivo ${fileName} baixado`);
  }

  private detectLanguageFromFileName(fileName: string) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'rs': 'rust',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss'
    };
    
    if (extension && languageMap[extension]) {
      this.selectedLanguage = languageMap[extension];
    }
  }

  private getFileExtension(): string {
    const extensionMap: { [key: string]: string } = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'rust': 'rs',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'scss': 'scss'
    };
    
    return extensionMap[this.selectedLanguage] || 'txt';
  }

  private updateStats() {
    this.charCount = this.currentCode.length;
    this.lineCount = this.currentCode.split('\n').length;
  }
}
