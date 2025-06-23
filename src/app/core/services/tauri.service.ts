import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Observable, from, catchError, map } from 'rxjs';
import { TauriResponse, GitCommit } from '../../shared/models';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class TauriService {
  constructor(private notificationService: NotificationService) {}

  /**
   * Verifica se está rodando no ambiente Tauri
   */
  isTauri(): boolean {
    // Verificações mais robustas para detectar ambiente Tauri
    if (typeof window === 'undefined') {
      return false;
    }

    // Verificar se __TAURI__ existe (método padrão)
    if ('__TAURI__' in window) {
      return true;
    }

    // Verificar se a função invoke está disponível
    try {
      if (typeof invoke === 'function') {
        return true;
      }
    } catch (error) {
      // Se houver erro ao acessar invoke, continuar verificações
    }

    // Para desenvolvimento: assumir que é Tauri se estivermos em ambiente local
    // e não for claramente um browser web
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      // Se não detectar user agent típico de browser, assumir Tauri
      const userAgent = navigator.userAgent.toLowerCase();
      const isBrowser = userAgent.includes('chrome') || 
                       userAgent.includes('firefox') || 
                       userAgent.includes('safari') || 
                       userAgent.includes('edge');
      
      // Se não for browser comum, provavelmente é Tauri
      return !isBrowser;
    }

    return false;
  }

  /**
   * Executa um comando Tauri de forma genérica
   */
  private executeCommand<T>(command: string, args?: Record<string, unknown>): Observable<T> {
    return from(invoke<TauriResponse<T>>(command, args)).pipe(
      map(response => {
        if (!response.success && response.error) {
          throw new Error(response.error);
        }
        return response.data as T;
      }),
      catchError(error => {
        this.notificationService.error(
          'Erro Tauri',
          `Falha ao executar comando: ${command}`,
          5000
        );
        throw error;
      })
    );
  }

  /**
   * Método invoke genérico para comandos Tauri
   */
  async invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    return invoke<T>(command, args);
  }

  /**
   * Comando de cumprimento (exemplo)
   */
  greet(name: string): Observable<string> {
    return this.executeCommand<string>('greet', { name });
  }

  /**
   * Listar commits Git (exemplo futuro)
   */
  getGitCommits(path: string): Observable<GitCommit[]> {
    return this.executeCommand<GitCommit[]>('get_git_commits', { path });
  }

  /**
   * Salvar arquivo
   */
  saveFile(path: string, content: string): Observable<boolean> {
    return this.executeCommand<boolean>('save_file', { path, content });
  }

  /**
   * Ler arquivo
   */
  readFile(path: string): Observable<string> {
    return this.executeCommand<string>('read_file', { path });
  }

  /**
   * Verificar se é um repositório Git
   */
  isGitRepository(path: string): Observable<boolean> {
    return this.executeCommand<boolean>('is_git_repository', { path });
  }

  /**
   * Abrir diálogo de seleção de pasta
   */
  openFolderDialog(): Observable<string | null> {
    return from(this.invoke<string | null>('open_folder_dialog'));
  }

  /**
   * Validar se um caminho é um diretório válido
   */
  validateDirectoryPath(path: string): Observable<boolean> {
    return from(this.invoke<boolean>('validate_directory_path', { path }));
  }

  /**
   * Obter informações do sistema
   */
  getSystemInfo(): Observable<any> {
    return from(this.invoke<any>('get_system_info'));
  }
}
