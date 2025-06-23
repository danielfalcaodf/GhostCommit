import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

// Models
import { GitDiff, GitDiffFile } from '../../models';

interface DiffStats {
  totalFiles: number;
  totalInsertions: number;
  totalDeletions: number;
  netChanges: number;
  addedFiles: number;
  modifiedFiles: number;
  deletedFiles: number;
  renamedFiles: number;
  copiedFiles: number;
  binaryFiles: number;
  largestFile: { name: string; changes: number } | null;
  mostActiveAuthor: { name: string; files: number } | null;
  filesByExtension: { [ext: string]: number };
  changesByDay: { date: string; insertions: number; deletions: number }[];
}

@Component({
  selector: 'app-diff-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './diff-stats.component.html',
  styleUrls: ['./diff-stats.component.scss']
})
export class DiffStatsComponent implements OnChanges {
  @Input() diff: GitDiff | null = null;
  @Input() files: GitDiffFile[] = [];

  stats: DiffStats = {
    totalFiles: 0,
    totalInsertions: 0,
    totalDeletions: 0,
    netChanges: 0,
    addedFiles: 0,
    modifiedFiles: 0,
    deletedFiles: 0,
    renamedFiles: 0,
    copiedFiles: 0,
    binaryFiles: 0,
    largestFile: null,
    mostActiveAuthor: null,
    filesByExtension: {},
    changesByDay: []
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['diff'] || changes['files']) {
      this.calculateStats();
    }
  }

  private calculateStats() {
    if (!this.diff && this.files.length === 0) return;

    const files = this.files.length > 0 ? this.files : (this.diff?.files || []);
    
    this.stats = {
      totalFiles: files.length,
      totalInsertions: files.reduce((sum, f) => sum + f.insertions, 0),
      totalDeletions: files.reduce((sum, f) => sum + f.deletions, 0),
      netChanges: 0,
      addedFiles: files.filter(f => f.status === 'added').length,
      modifiedFiles: files.filter(f => f.status === 'modified').length,
      deletedFiles: files.filter(f => f.status === 'deleted').length,
      renamedFiles: files.filter(f => f.status === 'renamed').length,
      copiedFiles: files.filter(f => f.status === 'copied').length,
      binaryFiles: files.filter(f => f.isBinary).length,
      largestFile: this.findLargestFile(files),
      mostActiveAuthor: null, // Implementar quando tiver dados de autor
      filesByExtension: this.groupFilesByExtension(files),
      changesByDay: []
    };

    this.stats.netChanges = this.stats.totalInsertions - this.stats.totalDeletions;
  }

  private findLargestFile(files: GitDiffFile[]): { name: string; changes: number } | null {
    if (files.length === 0) return null;

    const largest = files.reduce((max, file) => {
      const changes = file.insertions + file.deletions;
      return changes > (max.insertions + max.deletions) ? file : max;
    });

    return {
      name: largest.path,
      changes: largest.insertions + largest.deletions
    };
  }

  private groupFilesByExtension(files: GitDiffFile[]): { [ext: string]: number } {
    const extensions: { [ext: string]: number } = {};
    
    files.forEach(file => {
      const extension = file.path.split('.').pop();
      if (extension && extension !== file.path) {
        extensions[extension] = (extensions[extension] || 0) + 1;
      } else {
        extensions['no-ext'] = (extensions['no-ext'] || 0) + 1;
      }
    });

    return extensions;
  }

  getAdditionPercentage(): number {
    const total = this.stats.totalInsertions + this.stats.totalDeletions;
    return total > 0 ? (this.stats.totalInsertions / total) * 100 : 0;
  }

  getDeletionPercentage(): number {
    const total = this.stats.totalInsertions + this.stats.totalDeletions;
    return total > 0 ? (this.stats.totalDeletions / total) * 100 : 0;
  }

  hasExtensionStats(): boolean {
    return Object.keys(this.stats.filesByExtension).length > 0;
  }

  getTopExtensions(): { extension: string; count: number }[] {
    return Object.entries(this.stats.filesByExtension)
      .map(([ext, count]) => ({ extension: ext, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  getExtensionPercentage(count: number): number {
    const maxCount = Math.max(...Object.values(this.stats.filesByExtension));
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  }

  getComplexityLevel(): string {
    const totalChanges = this.getTotalChanges();
    
    if (totalChanges < 50) return 'Baixa';
    if (totalChanges < 200) return 'Média';
    if (totalChanges < 500) return 'Alta';
    return 'Muito Alta';
  }

  getTotalChanges(): number {
    return this.stats.totalInsertions + this.stats.totalDeletions;
  }

  exportExtensionStats() {
    const data = this.getTopExtensions();
    const csv = 'Extensão,Arquivos\n' + 
                data.map(item => `${item.extension},${item.count}`).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = 'extensoes-estatisticas.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
