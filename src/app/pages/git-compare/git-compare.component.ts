import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

// Angular Material
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTabsModule } from "@angular/material/tabs";
import { MatChipsModule } from "@angular/material/chips";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatTooltipModule } from "@angular/material/tooltip";

// Services and Models
import { GitService } from "../../core/services/git.service";
import { GitCompareStateService } from "../../core/services/git-compare-state.service";
import { SnackBarNotificationService } from "../../core/services/snackbar-notification.service";
import {
  GitRepository,
  GitRef,
  GitCommit,
  GitComparisonResult,
  GitFileComparison,
  GitRefType,
  GitDiffFile,
  GitFileDiff,
  GitDiffLineType,
} from "../../shared/models";

// Shared Components
import { MonacoEditorComponent } from "../../shared/components/monaco-editor/monaco-editor.component";
import { invoke } from "@tauri-apps/api/core";

@Component({
  selector: "app-git-compare",
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
  ],
  templateUrl: "./git-compare.component.html",
  styleUrls: ["./git-compare.component.scss"],
})
export class GitCompareComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Estados de dados
  currentRepository: GitRepository | null = null;
  repositoryPath = "";
  refs: GitRef[] = [];
  groupedRefs: { label: string; refs: GitRef[] }[] = [];

  // Estados de seleção
  selectedBranchRefA = "";
  selectedBranchRefB = "";
  selectedRefA = "";
  selectedRefB = "";

  // Commits das branches selecionadas
  commitsA: GitCommit[] = [];
  commitsB: GitCommit[] = [];
  loadingCommitsA = false;
  loadingCommitsB = false;

  // Estados de UI
  loading = false;
  loadingMessage = "";
  comparisonResult: GitComparisonResult | null = null;
  selectedFile: GitFileComparison | null = null;
  diffContent = "";

  // Estados de filtro
  searchTerm = "";
  statusFilter = "";
  filteredFiles: GitFileDiff[] = [];

  // Filtros para branches
  branchFilterA = '';
  branchFilterB = '';
  filteredBranchesA: GitRef[] = [];
  filteredBranchesB: GitRef[] = [];

  // Filtros para commits  
  commitFilterA = '';
  commitFilterB = '';
  filteredCommitsA: GitCommit[] = [];
  filteredCommitsB: GitCommit[] = [];

  get branches(): GitRef[] {
    return this.refs?.filter((ref) => ref.type === "branch") || [];
  }
  get commits(): GitRef[] {
    return this.refs?.filter((ref) => ref.type === "commit") || [];
  }
  constructor(
    private gitService: GitService,
    private snackBarNotification: SnackBarNotificationService,
    private router: Router,
    private stateService: GitCompareStateService
  ) { }

  ngOnInit(): void {
    this.restoreStateIfAvailable();
    this.loadInitialData();
  }

  private restoreStateIfAvailable(): void {
    const state = this.stateService.getState();
    if (state.repository && state.repositoryPath) {
      this.currentRepository = state.repository;
      this.repositoryPath = state.repositoryPath;
      
      if (state.selectedRefA && state.selectedRefB && state.selectedBranchRefA && state.selectedBranchRefB) {
        this.selectedRefA = state.selectedRefA;
        this.selectedRefB = state.selectedRefB;
        this.selectedBranchRefA = state.selectedBranchRefA;
        this.selectedBranchRefB = state.selectedBranchRefB;
      }
      
      // Restaurar arrays de commits
      if (state.commitsA) {
        this.commitsA = state.commitsA;
        this.initializeCommitFiltersA();
      }
      
      if (state.commitsB) {
        this.commitsB = state.commitsB;
        this.initializeCommitFiltersB();
      }
      
      if (state.comparisonResult) {
        this.comparisonResult = state.comparisonResult;
        this.updateFilteredFiles();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    // Verificar se há um repositório já aberto
    const currentRepo = this.gitService.getCurrentRepository();
    if (currentRepo) {
      this.currentRepository = currentRepo;
      this.repositoryPath = currentRepo.path;
      this.loadRefs();
    }
  }

  async loadRepository(): Promise<void> {
    if (!this.repositoryPath.trim()) {
      this.snackBarNotification.showError(
        "Por favor, informe o caminho do repositório"
      );
      return;
    }

    this.loading = true;
    this.loadingMessage = "Carregando repositório...";

    try {
      const repo = await this.gitService
        .openRepository(this.repositoryPath)
        .toPromise();
      this.currentRepository = repo || null;
      await this.loadRefs();
      this.snackBarNotification.showSuccess(
        `Repositório ${this.currentRepository?.name} carregado com sucesso`
      );
    } catch (error: any) {
      console.error("Erro ao carregar repositório:", error);
      this.snackBarNotification.showError(
        `Erro ao carregar repositório: ${error.message}`
      );
    } finally {
      this.loading = false;
    }
  }

  private async loadRefs(): Promise<void> {
    if (!this.currentRepository) return;

    try {
      this.refs = (await this.gitService.getAllRefs().toPromise()) || [];
      this.groupRefs();
    } catch (error: any) {
      console.error("Erro ao carregar referências:", error);
      this.snackBarNotification.showError(
        `Erro ao carregar referências: ${error.message}`
      );
    }
  }

  private groupRefs(): void {
    const branches = this.refs.filter((ref) => ref.type === "branch");
    const tags = this.refs.filter((ref) => ref.type === "tag");
    const commits = this.refs.filter((ref) => ref.type === "commit");

    this.groupedRefs = [
      { label: "Branches", refs: branches },
      { label: "Tags", refs: tags },
      { label: "Commits Recentes", refs: commits },
    ].filter((group) => group.refs.length > 0);

    // Inicializar filtros de branches
    this.initializeBranchFilters();
  }

  async compareCommits(): Promise<void> {
    if (!this.canCompare()) return;

    this.loading = true;
    this.loadingMessage = "Comparando commits...";
    this.comparisonResult = null;

    try {
      const result = await this.gitService
        .compareCommits(this.selectedRefA, this.selectedRefB)
        .toPromise();
      debugger
      this.comparisonResult = result || null;

      this.snackBarNotification.showSuccess(
        `Comparação concluída: ${this.comparisonResult?.diff.files.length || 0
        } arquivos alterados`
      );

      // Atualizar lista filtrada
      this.updateFilteredFiles();
    } catch (error: any) {
      this.snackBarNotification.showError(
        `Erro na comparação: ${error.message}`
      );
    } finally {
      this.loading = false;
    }
  }

  onFileSelected(file: GitFileComparison): void {
    this.selectedFile = file;
  }

  async viewFileDiff(file: GitFileDiff): Promise<void> {
    if (!this.currentRepository || !this.selectedRefA || !this.selectedRefB) {
      this.snackBarNotification.showError(
        "Informações insuficientes para visualizar diff"
      );
      return;
    }

    // Salvar estado atual
    this.saveCurrentState();

    // Navegar para a página git-diff
    const repoPath = encodeURIComponent(this.repositoryPath);
    const filePath = encodeURIComponent(file.new_path || '');
    
    this.router.navigate([
      '/git-diff',
      repoPath,
      this.selectedRefA,
      this.selectedRefB,
      filePath
    ]);
  }

  private saveCurrentState(): void {
    this.stateService.setRepository(this.currentRepository!, this.repositoryPath);
    this.stateService.setSelectedRefs(
      this.selectedRefA!,
      this.selectedRefB!,
      this.selectedBranchRefA!,
      this.selectedBranchRefB!
    );
    if (this.comparisonResult) {
      this.stateService.setComparisonResult(this.comparisonResult);
    }
    this.stateService.setLastCompareParams(
      this.repositoryPath,
      this.selectedRefA!,
      this.selectedRefB!
    );
  }

  private formatDiffContent(fileComparison: GitFileComparison): string {
    if (!fileComparison.hunks || fileComparison.hunks.length === 0) {
      return fileComparison.new_content || fileComparison.old_content || "";
    }

    let diffContent = "";
    fileComparison.hunks.forEach((hunk) => {
      diffContent += `${hunk.header}\n`;
      hunk.lines.forEach((line) => {
        const prefix =
          line.type === GitDiffLineType.ADDED ? "+" : line.type === GitDiffLineType.DELETED ? "-" : " ";
        diffContent += `${prefix}${line.content}\n`;
      });
    });

    return diffContent;
  }

  canCompare(): boolean {
    return this.selectedRefA !== "" && this.selectedRefB !== "";
  }

  getRefIcon(type: GitRefType): string {
    switch (type) {
      case "branch":
        return "call_split";
      case "tag":
        return "local_offer";
      case "commit":
        return "commit";
      default:
        return "help";
    }
  }

  getFileStatusIcon(status: string): string {
    switch (status) {
      case "added":
        return "add";
      case "modified":
        return "edit";
      case "deleted":
        return "remove";
      case "renamed":
        return "drive_file_move";
      default:
        return "help";
    }
  }

  async openRepositoryDialog(): Promise<void> {
    try {
      // Usar comando Tauri para abrir dialog de seleção de pasta
      const selectedPath = await this.openDirectoryDialog();
      if (selectedPath) {
        this.repositoryPath = selectedPath;
        this.snackBarNotification.showInfo(
          `Caminho selecionado: ${selectedPath}`
        );
        await this.loadRepository();
      } else {
        this.snackBarNotification.showWarning("Nenhuma pasta foi selecionada");
      }
    } catch (error: any) {
      this.snackBarNotification.showError(
        `Erro ao selecionar repositório: ${error.message}`
      );
    }
  }

  private async openDirectoryDialog(): Promise<string | null> {
    try {
      // Usar comando Tauri 'open_folder_dialog' que utiliza dialog nativo do sistema
      // Permite navegação pelas pastas e seleção de diretórios
      // Retorna o caminho completo do diretório selecionado
      const selectedPath = await invoke<string | null>("open_folder_dialog");
      return selectedPath;
    } catch (error) {
      console.error("Erro ao abrir dialog de diretório:", error);
      return null;
    }
  }

  exportComparison(format: "html" | "markdown" | "text" = "html"): void {
    if (!this.comparisonResult) {
      this.snackBarNotification.showError("Nenhuma comparação para exportar");
      return;
    }

    try {
      let content = "";
      const timestamp = new Date().toLocaleString();
      const stats = this.comparisonResult.diff.stats;

      switch (format) {
        case "html":
          content = this.generateHtmlReport();
          break;
        case "markdown":
          content = this.generateMarkdownReport();
          break;
        case "text":
          content = this.generateTextReport();
          break;
      }

      this.downloadFile(
        content,
        `git-comparison-${timestamp}.${format}`,
        this.getMimeType(format)
      );
      this.snackBarNotification.showSuccess(
        `Relatório exportado em formato ${format.toUpperCase()}`
      );
    } catch (error: any) {
      this.snackBarNotification.showError(`Erro ao exportar: ${error.message}`);
    }
  }

  private generateHtmlReport(): string {
    const stats = this.comparisonResult!.diff.stats;
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Git Comparison Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { border-bottom: 2px solid #eee; padding-bottom: 20px; }
    .stats { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .file-list { margin: 20px 0; }
    .file-item { padding: 10px; border-left: 4px solid #ddd; margin: 10px 0; }
    .added { border-left-color: #28a745; }
    .deleted { border-left-color: #dc3545; }
    .modified { border-left-color: #ffc107; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Git Comparison Report</h1>
    <p><strong>From:</strong> ${this.selectedRefA}</p>
    <p><strong>To:</strong> ${this.selectedRefB}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="stats">
    <h2>Summary</h2>
    <ul>
      <li>Files changed: ${stats.total_files || 0}</li>
      <li>Insertions: +${stats.total_insertions || 0}</li>
      <li>Deletions: -${stats.total_deletions || 0}</li>
    </ul>
  </div>
  
  <div class="file-list">
    <h2>Modified Files</h2>
    ${this.comparisonResult!.diff.files.map(
      (file) => `
      <div class="file-item ${file.status}">
        <strong>${file.new_path}</strong> (${file.status})
        <br>+${file.insertions || 0} -${file.deletions || 0}
      </div>
    `
    ).join("")}
  </div>
</body>
</html>`;
  }

  private generateMarkdownReport(): string {
    const stats = this.comparisonResult!.diff.stats;
    return `# Git Comparison Report

**From:** \`${this.selectedRefA}\`  
**To:** \`${this.selectedRefB}\`  
**Generated:** ${new Date().toLocaleString()}

## Summary

- **Files changed:** ${stats.total_files || 0}
- **Insertions:** +${stats.total_insertions || 0}
- **Deletions:** -${stats.total_deletions || 0}

## Modified Files

${this.comparisonResult!.diff.files.map(
      (file) =>
        `- **${file.new_path}** (${file.status}) - +${file.insertions || 0} -${file.deletions || 0
        }`
    ).join("\n")}
`;
  }

  private generateTextReport(): string {
    const stats = this.comparisonResult!.diff.stats;
    return `Git Comparison Report
====================

From: ${this.selectedRefA}
To: ${this.selectedRefB}
Generated: ${new Date().toLocaleString()}

Summary:
--------
Files changed: ${stats.total_files || 0}
Insertions: +${stats.total_insertions || 0}
Deletions: -${stats.total_deletions || 0}

Modified Files:
--------------
${this.comparisonResult!.diff.files.map(
      (file) =>
        `${file.new_path} (${file.status}) - +${file.insertions || 0} -${file.deletions || 0
        }`
    ).join("\n")}`;
  }

  private downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private getMimeType(format: string): string {
    switch (format) {
      case "html":
        return "text/html";
      case "markdown":
        return "text/markdown";
      case "text":
        return "text/plain";
      default:
        return "text/plain";
    }
  }

  private updateFilteredFiles(): void {
    if (!this.comparisonResult) {
      this.filteredFiles = [];
      return;
    }

    let files = this.comparisonResult.diff.files;

    // Filtrar por termo de busca
    if (this.searchTerm) {
      files = files.filter((file) =>
        file.new_path?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (this.statusFilter) {
      files = files.filter((file) => file.status === this.statusFilter);
    }
    debugger
    this.filteredFiles = files;
  }

  onSearchChange(): void {
    this.updateFilteredFiles();
  }

  onStatusFilterChange(): void {
    this.updateFilteredFiles();
  }

  clearFilters(): void {
    this.searchTerm = "";
    this.statusFilter = "";
    this.updateFilteredFiles();
  }

  getUniqueStatuses(): string[] {
    if (!this.comparisonResult) return [];

    const statuses = this.comparisonResult.diff.files.map(
      (file) => file.status
    );
    return [...new Set(statuses)];
  }

  /**
   * Evento disparado quando a Branch A é alterada
   */
  async onBranchAChange(): Promise<void> {
    if (!this.selectedBranchRefA || !this.currentRepository) {
      this.commitsA = [];
      this.selectedRefA = "";
      return;
    }

    this.loadingCommitsA = true;
    this.commitsA = [];
    this.selectedRefA = "";

    try {
      // Carregar commits da branch selecionada
      const commits = await this.gitService
        .getCommits(200, 0, this.selectedBranchRefA)
        .toPromise();
      this.commitsA = commits || [];

      // Salvar commits no estado
      this.stateService.setCommitsA(this.commitsA);

      if (this.commitsA.length > 0) {
        // Auto-selecionar o primeiro commit (mais recente)
        this.selectedRefA = this.commitsA[0].hash;
      }

      // Inicializar filtros de commits A
      this.initializeCommitFiltersA();
    } catch (error: any) {
      console.error("Erro ao carregar commits da Branch A:", error);
      this.snackBarNotification.showError(
        `Erro ao carregar commits da branch ${this.selectedBranchRefA}: ${error.message}`
      );
    } finally {
      this.loadingCommitsA = false;
    }
  }

  /**
   * Evento disparado quando a Branch B é alterada
   */
  async onBranchBChange(): Promise<void> {
    if (!this.selectedBranchRefB || !this.currentRepository) {
      this.commitsB = [];
      this.selectedRefB = "";
      return;
    }

    this.loadingCommitsB = true;
    this.commitsB = [];
    this.selectedRefB = "";

    try {
      // Carregar commits da branch selecionada
      const commits = await this.gitService
        .getCommits(200, 0, this.selectedBranchRefB)
        .toPromise();
      this.commitsB = commits || [];

      // Salvar commits no estado
      this.stateService.setCommitsB(this.commitsB);

      if (this.commitsB.length > 0) {
        // Auto-selecionar o primeiro commit (mais recente)
        this.selectedRefB = this.commitsB[0].hash;
      }

      // Inicializar filtros de commits B
      this.initializeCommitFiltersB();
    } catch (error: any) {
      console.error("Erro ao carregar commits da Branch B:", error);
      this.snackBarNotification.showError(
        `Erro ao carregar commits da branch ${this.selectedBranchRefB}: ${error.message}`
      );
    } finally {
      this.loadingCommitsB = false;
    }
  }

  getBranchType(name: string): GitRefType {
    return this.branches.find((b) => b.name === name)?.type || GitRefType.BRANCH;
  }

  getBranchDisplayName(name: string): string {
    return this.branches.find((b) => b.name === name)?.display_name || "";
  }
  formatCommitMessage(message: string): string {

    return this.gitService.formatCommitMessage(message, 100);
  }
  formatCommitHash(hash: string): string {
    return this.gitService.formatCommitHash(hash, 7);
  }
  formatCommitDate(date: Date): string {
    return this.gitService.formatDate(date);
  }

  /**
   * Métodos de filtro para branches
   */
  filterBranchesA(): void {
    if (!this.branchFilterA.trim()) {
      this.filteredBranchesA = [...this.branches];
    } else {
      this.filteredBranchesA = this.branches.filter(branch =>
        branch.name.toLowerCase().includes(this.branchFilterA.toLowerCase()) ||
        branch.display_name.toLowerCase().includes(this.branchFilterA.toLowerCase())
      );
    }
  }

  filterBranchesB(): void {
    if (!this.branchFilterB.trim()) {
      this.filteredBranchesB = [...this.branches];
    } else {
      this.filteredBranchesB = this.branches.filter(branch =>
        branch.name.toLowerCase().includes(this.branchFilterB.toLowerCase()) ||
        branch.display_name.toLowerCase().includes(this.branchFilterB.toLowerCase())
      );
    }
  }

  /**
   * Métodos de filtro para commits
   */
  filterCommitsA(): void {
    if (!this.commitFilterA.trim()) {
      this.filteredCommitsA = [...this.commitsA];
    } else {
      this.filteredCommitsA = this.commitsA.filter(commit =>
        commit.hash.toLowerCase().includes(this.commitFilterA.toLowerCase()) ||
        commit.message.toLowerCase().includes(this.commitFilterA.toLowerCase()) ||
        commit.author.name.toLowerCase().includes(this.commitFilterB.toLowerCase()) ||
        commit.author.email.toLowerCase().includes(this.commitFilterB.toLowerCase())
      );
    }
  }

  filterCommitsB(): void {
    if (!this.commitFilterB.trim()) {
      this.filteredCommitsB = [...this.commitsB];
    } else {
      this.filteredCommitsB = this.commitsB.filter(commit =>
        commit.hash.toLowerCase().includes(this.commitFilterB.toLowerCase()) ||
        commit.message.toLowerCase().includes(this.commitFilterB.toLowerCase()) ||
        commit.author.name.toLowerCase().includes(this.commitFilterB.toLowerCase()) ||
        commit.author.email.toLowerCase().includes(this.commitFilterB.toLowerCase())
      );
    }
  }

  /**
   * Inicializar filtros quando dados são carregados
   */
  private initializeBranchFilters(): void {
    this.filteredBranchesA = [...this.branches];
    this.filteredBranchesB = [...this.branches];
  }

  private initializeCommitFiltersA(): void {
    this.filteredCommitsA = [...this.commitsA];
  }

  private initializeCommitFiltersB(): void {
    this.filteredCommitsB = [...this.commitsB];
  }
}
