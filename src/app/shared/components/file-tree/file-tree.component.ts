import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Models
import { GitDiffFile, GitFileComparison } from '../../models';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  fileInfo?: GitDiffFile;
  level: number;
}

interface FlatFileNode {
  expandable: boolean;
  name: string;
  path: string;
  level: number;
  isDirectory: boolean;
  fileInfo?: GitDiffFile;
}

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [
    CommonModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatProgressBarModule
  ],
  templateUrl: './file-tree.component.html',
  styleUrls: ['./file-tree.component.scss']
})
export class FileTreeComponent implements OnInit, OnChanges {
  @Input() files: GitDiffFile[] = [];
  @Input() comparison: any = null; // GitComparisonResult
  @Input() loadingFiles = new Set<string>();
  @Output() fileSelected = new EventEmitter<GitDiffFile>();
  @Output() fileDoubleClicked = new EventEmitter<GitDiffFile>();

  // Tree control
  private _transformer = (node: FileNode, level: number): FlatFileNode => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      path: node.path,
      level: level,
      isDirectory: node.isDirectory,
      fileInfo: node.fileInfo,
    };
  };

  treeControl = new FlatTreeControl<FlatFileNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  // State
  selectedFile: string | null = null;
  showFilter: 'all' | 'added' | 'modified' | 'deleted' = 'all';
  filteredFiles: GitDiffFile[] = [];
  
  // Statistics
  totalFiles = 0;
  totalInsertions = 0;
  totalDeletions = 0;

  ngOnInit() {
    this.updateTree();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['files'] || changes['comparison']) {
      this.updateTree();
    }
  }

  private updateTree() {
    // Usar arquivos da comparação se disponível, senão usar files direto
    const sourceFiles = this.comparison?.diff?.files || this.files;
    this.files = sourceFiles;
    
    this.calculateStats();
    this.applyFilter();
    this.buildTree();
  }

  private calculateStats() {
    this.totalFiles = this.files.length;
    this.totalInsertions = this.files.reduce((sum, file) => sum + file.insertions, 0);
    this.totalDeletions = this.files.reduce((sum, file) => sum + file.deletions, 0);
  }

  private applyFilter() {
    if (this.showFilter === 'all') {
      this.filteredFiles = [...this.files];
    } else {
      this.filteredFiles = this.files.filter(file => file.status === this.showFilter);
    }
  }

  private buildTree() {
    const root: FileNode[] = [];
    const nodeMap = new Map<string, FileNode>();

    // Criar nós para cada arquivo filtrado
    this.filteredFiles.forEach(file => {
      const pathParts = file.path.split('/');
      let currentPath = '';

      pathParts.forEach((part, index) => {
        const isLast = index === pathParts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!nodeMap.has(currentPath)) {
          const node: FileNode = {
            name: part,
            path: currentPath,
            isDirectory: !isLast,
            children: isLast ? undefined : [],
            fileInfo: isLast ? file : undefined,
            level: index
          };

          nodeMap.set(currentPath, node);

          // Adicionar ao pai ou à raiz
          if (index === 0) {
            root.push(node);
          } else {
            const parentPath = pathParts.slice(0, index).join('/');
            const parent = nodeMap.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(node);
            }
          }
        }
      });
    });

    this.dataSource.data = root;
  }

  hasChild = (_: number, node: FlatFileNode): boolean => node.expandable;

  selectFile(node: FlatFileNode) {
    if (!node.isDirectory && node.fileInfo) {
      this.selectedFile = node.path;
      this.fileSelected.emit(node.fileInfo);
    }
  }

  onFileDoubleClick(node: FlatFileNode) {
    if (!node.isDirectory && node.fileInfo) {
      this.fileDoubleClicked.emit(node.fileInfo);
    }
  }

  setFilter(filter: 'all' | 'added' | 'modified' | 'deleted') {
    this.showFilter = filter;
    this.updateTree();
  }

  getFilesByStatus(status: string): GitDiffFile[] {
    return this.files.filter(file => file.status === status);
  }

  expandAll() {
    this.treeControl.expandAll();
  }

  collapseAll() {
    this.treeControl.collapseAll();
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const iconMap: { [key: string]: string } = {
      'js': 'integration_instructions',
      'ts': 'integration_instructions',
      'html': 'web',
      'css': 'palette',
      'scss': 'palette',
      'json': 'data_object',
      'md': 'description',
      'py': 'smart_toy',
      'rs': 'settings',
      'java': 'coffee',
      'cpp': 'memory',
      'c': 'memory',
      'go': 'speed',
      'php': 'web',
      'rb': 'diamond',
      'swift': 'phone_iphone',
      'kt': 'android'
    };

    return iconMap[extension || ''] || 'description';
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'added': return 'add';
      case 'deleted': return 'remove';
      case 'modified': return 'edit';
      case 'renamed': return 'drive_file_rename_outline';
      case 'copied': return 'content_copy';
      default: return 'help';
    }
  }

  getStatusTooltip(status: string): string {
    switch (status) {
      case 'added': return 'Arquivo adicionado';
      case 'deleted': return 'Arquivo removido';
      case 'modified': return 'Arquivo modificado';
      case 'renamed': return 'Arquivo renomeado';
      case 'copied': return 'Arquivo copiado';
      default: return 'Status desconhecido';
    }
  }

  getFileCountInFolder(node: FlatFileNode): number {
    // Contar arquivos na pasta (implementação simplificada)
    return this.filteredFiles.filter(file => 
      file.path.startsWith(node.path + '/') || file.path === node.path
    ).length;
  }

  getEmptyStateMessage(): string {
    switch (this.showFilter) {
      case 'added': return 'Nenhum arquivo foi adicionado';
      case 'modified': return 'Nenhum arquivo foi modificado';
      case 'deleted': return 'Nenhum arquivo foi removido';
      default: return 'Nenhum arquivo alterado encontrado';
    }
  }
}
