import { Injectable } from '@angular/core';
import { Observable, from, catchError, map, forkJoin } from 'rxjs';
import { invoke } from '@tauri-apps/api/core';
import { 
  GitRepository, 
  GitCommit, 
  GitBranch, 
  GitTag, 
  GitDiff, 
  GitComparisonResult, 
  GitFileComparison, 
  GitRef, 
  GitRefType,
  TauriResponse 
} from '../../shared/models';
import { NotificationService } from './notification.service';
import { TauriService } from './tauri.service';

@Injectable({
  providedIn: 'root'
})
export class GitService {
  private currentRepository: GitRepository | null = null;

  constructor(
    private notificationService: NotificationService,
    private tauriService: TauriService
  ) {}

  /**
   * Abre e configura um repositório Git
   */
  openRepository(path: string): Observable<GitRepository> {
    // Verificação mais flexível para desenvolvimento
    if (!this.isTauriEnvironmentAvailable()) {
      throw new Error('Git operations are only available in Tauri environment');
    }

    return this.executeCommand<GitRepository>('git_open_repository', { path }).pipe(
      map(repo => {
        this.currentRepository = repo;
        return repo; // Remover notificação aqui para evitar conflito
      })
    );
  }

  /**
   * Verifica se o ambiente Tauri está disponível de forma mais flexível
   */
  private isTauriEnvironmentAvailable(): boolean {
    // Primeiro, verificar se é claramente Tauri
    if (this.tauriService.isTauri()) {
      return true;
    }

    // Se estiver em desenvolvimento local, tentar invocar
    try {
      // Verificar se invoke está disponível
      if (typeof invoke === 'function') {
        return true;
      }
    } catch (error) {
      console.warn('Tauri invoke not available:', error);
    }

    // Em desenvolvimento, permitir se estivermos em localhost
    const isLocalDev = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
    
    if (isLocalDev) {
      console.log('Development mode detected, allowing Tauri operations');
      return true;
    }

    return false;
  }

  /**
   * Obtém informações do repositório atual
   */
  getCurrentRepository(): GitRepository | null {
    return this.currentRepository;
  }

  /**
   * Lista todos os commits do repositório
   */
  getCommits(limit: number = 100, offset: number = 0, branch?: string): Observable<GitCommit[]> {
    return this.executeCommand<GitCommit[]>('git_get_commits', { 
      path: this.currentRepository?.path,
      limit,
      offset,
      branch 
    });
  }

  /**
   * Lista todas as branches do repositório
   */
  getBranches(): Observable<GitBranch[]> {
    return this.executeCommand<GitBranch[]>('git_get_branches', { 
      path: this.currentRepository?.path 
    });
  }

  /**
   * Lista todas as tags do repositório
   */
  getTags(): Observable<GitTag[]> {
    return this.executeCommand<GitTag[]>('git_get_tags', { 
      path: this.currentRepository?.path 
    });
  }

  /**
   * Obtém todas as referências (commits, branches, tags) para seleção
   */
  getAllRefs(): Observable<GitRef[]> {
    if (!this.currentRepository) {
      throw new Error('No repository opened');
    }

    return forkJoin({
      commits: this.getCommits(50),
      branches: this.getBranches(),
      tags: this.getTags()
    }).pipe(
      map(({ commits, branches, tags }) => {
        const refs: GitRef[] = [];

        // Adicionar commits recentes
        commits.forEach(commit => {
          refs.push({
            name: commit.hash,
            hash: commit.hash,
            type: GitRefType.COMMIT,
            display_name: `${commit.short_hash} - ${commit.message.substring(0, 50)}...`
          });
        });

        // Adicionar branches
        branches.forEach(branch => {
          refs.push({
            name: branch.name,
            hash: branch.hash,
            type: GitRefType.BRANCH,
            display_name: `${branch.name} (branch)`
          });
        });

        // Adicionar tags
        tags.forEach(tag => {
          refs.push({
            name: tag.name,
            hash: tag.hash,
            type: GitRefType.TAG,
            display_name: `${tag.name} (tag)`
          });
        });

        return refs;
      })
    );
  }

  /**
   * Compara dois commits e retorna o diff completo
   */
  compareCommits(fromRef: string, toRef: string): Observable<GitComparisonResult> {
    if (!this.currentRepository) {
      throw new Error('No repository opened');
    }

    return this.executeCommand<GitComparisonResult>('git_compare_commits', {
      path: this.currentRepository.path,
      from_ref: fromRef,
      to_ref: toRef
    }).pipe(
      map(result => {
        this.notificationService.showSuccess(
          `Comparação concluída: ${result.diff.stats.total_files} arquivos alterados`
        );
        return result;
      })
    );
  }

  /**
   * Obtém detalhes de um arquivo específico no diff
   */
  getFileComparison(fromRef: string, toRef: string, filePath: string): Observable<GitFileComparison> {
    if (!this.currentRepository) {
      throw new Error('No repository opened');
    }

    return this.executeCommand<GitFileComparison>('git_get_file_comparison', {
      path: this.currentRepository.path,
      from_ref: fromRef,
      to_ref: toRef,
      file_path: filePath
    });
  }

  /**
   * Obtém informações de blame para um arquivo específico
   */
  getFileBlame(filePath: string, commitHash?: string): Observable<any> {
    if (!this.currentRepository) {
      throw new Error('No repository opened');
    }

    return this.executeCommand('git_get_file_blame', {
      path: this.currentRepository.path,
      file_path: filePath,
      commit_hash: commitHash
    });
  }

  /**
   * Obtém conteúdo de um arquivo em um commit específico
   */
  getFileContent(filePath: string, commitHash: string): Observable<string> {
    if (!this.currentRepository) {
      throw new Error('No repository opened');
    }

    return this.executeCommand<string>('git_get_file_content', {
      path: this.currentRepository.path,
      file_path: filePath,
      commit_hash: commitHash
    });
  }

  /**
   * Detecta a linguagem de um arquivo baseado na extensão
   */
  detectLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cxx': 'cpp',
      'cc': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell',
      'ps1': 'powershell',
      'html': 'html',
      'htm': 'html',
      'xml': 'xml',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'cfg': 'ini',
      'conf': 'ini',
      'md': 'markdown',
      'markdown': 'markdown',
      'tex': 'latex',
      'sql': 'sql',
      'dockerfile': 'dockerfile',
      'makefile': 'makefile',
      'cmake': 'cmake',
      'gradle': 'gradle',
      'maven': 'xml',
      'pom': 'xml'
    };

    return languageMap[extension || ''] || 'plaintext';
  }

  /**
   * Verifica se um caminho é um repositório Git válido
   */
  isValidRepository(path: string): Observable<boolean> {
    return this.executeCommand<boolean>('git_is_valid_repository', { path });
  }

  /**
   * Obtém estatísticas do repositório
   */
  getRepositoryStats(): Observable<any> {
    if (!this.currentRepository) {
      throw new Error('No repository opened');
    }

    return this.executeCommand('git_get_repository_stats', {
      path: this.currentRepository.path
    });
  }

  /**
   * Executa um comando Git genérico via Tauri
   */
  private executeCommand<T>(command: string, args?: Record<string, unknown>): Observable<T> {
    return from(invoke<TauriResponse<T>>(command, { params: args })).pipe(
      map(response => {
        if (!response.success && response.error) {
          throw new Error(response.error);
        }
        return response.data as T;
      }),
      catchError(error => {
        this.notificationService.showError(
          `Erro Git: ${error.message || 'Operação falhou'}`
        );
        throw error;
      })
    );
  }

  /**
   * Formata hash de commit para exibição
   */
  formatCommitHash(hash: string, length: number = 7): string {
    return hash.substring(0, length);
  }

  /**
   * Formata data para exibição
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Formata mensagem de commit para exibição
   */
  formatCommitMessage(message: string, maxLength: number = 72): string {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength - 3) + '...';
  }
}
