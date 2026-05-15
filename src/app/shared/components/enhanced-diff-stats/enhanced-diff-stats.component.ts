import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Models
import { GitFileComparison, GitDiffFile } from '../../models';

interface DiffStatsSummary {
  totalLines: number;
  addedLines: number;
  deletedLines: number;
  modifiedLines: number;
  changedFiles: number;
  addedFiles: number;
  deletedFiles: number;
  renamedFiles: number;
  binaryFiles: number;
  additions: number;
  deletions: number;
  netChange: number;
  changePercentage: number;
}

@Component({
  selector: 'app-enhanced-diff-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  templateUrl: './enhanced-diff-stats.component.html',
  styleUrls: ['./enhanced-diff-stats.component.scss']
})
export class EnhancedDiffStatsComponent implements OnInit, OnChanges {
  @Input() fileComparison: GitFileComparison | null = null;
  @Input() leftRef: string = '';
  @Input() rightRef: string = '';
  @Input() showDetails: boolean = true;
  @Input() compact: boolean = false;

  stats: DiffStatsSummary = {
    totalLines: 0,
    addedLines: 0,
    deletedLines: 0,
    modifiedLines: 0,
    changedFiles: 0,
    addedFiles: 0,
    deletedFiles: 0,
    renamedFiles: 0,
    binaryFiles: 0,
    additions: 0,
    deletions: 0,
    netChange: 0,
    changePercentage: 0
  };

  constructor() {}

  ngOnInit(): void {
    this.calculateStats();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fileComparison']) {
      this.calculateStats();
    }
  }

  private calculateStats(): void {
    if (!this.fileComparison) {
      this.resetStats();
      return;
    }

    // Calcular estatísticas básicas
    this.stats.additions = this.fileComparison.diff?.insertions || 0;
    this.stats.deletions = this.fileComparison.diff?.deletions || 0;
    this.stats.netChange = this.stats.additions - this.stats.deletions;

    // Analisar hunks para estatísticas detalhadas
    if (this.fileComparison.diff?.hunks) {
      this.analyzeHunks();
    }

    // Calcular porcentagem de mudança
    this.calculateChangePercentage();

    // Estatísticas de arquivo
    this.stats.changedFiles = 1;
    this.stats.binaryFiles = this.fileComparison.binary ? 1 : 0;

    switch (this.fileComparison.status) {
      case 'added':
        this.stats.addedFiles = 1;
        break;
      case 'deleted':
        this.stats.deletedFiles = 1;
        break;
      case 'renamed':
        this.stats.renamedFiles = 1;
        break;
    }
  }

  private analyzeHunks(): void {
    if (!this.fileComparison?.diff?.hunks) return;

    let addedLines = 0;
    let deletedLines = 0;
    let contextLines = 0;

    this.fileComparison.diff.hunks.forEach(hunk => {
      if (hunk.lines) {
        hunk.lines.forEach(line => {
          switch (line.type) {
            case 'added':
              addedLines++;
              break;
            case 'deleted':
              deletedLines++;
              break;
            case 'context':
              contextLines++;
              break;
          }
        });
      }
    });

    this.stats.addedLines = addedLines;
    this.stats.deletedLines = deletedLines;
    this.stats.totalLines = addedLines + deletedLines + contextLines;
    this.stats.modifiedLines = addedLines + deletedLines;
  }

  private calculateChangePercentage(): void {
    const totalChanges = this.stats.additions + this.stats.deletions;
    if (this.stats.totalLines > 0) {
      this.stats.changePercentage = Math.round((totalChanges / this.stats.totalLines) * 100);
    } else {
      this.stats.changePercentage = totalChanges > 0 ? 100 : 0;
    }
  }

  private resetStats(): void {
    this.stats = {
      totalLines: 0,
      addedLines: 0,
      deletedLines: 0,
      modifiedLines: 0,
      changedFiles: 0,
      addedFiles: 0,
      deletedFiles: 0,
      renamedFiles: 0,
      binaryFiles: 0,
      additions: 0,
      deletions: 0,
      netChange: 0,
      changePercentage: 0
    };
  }

  // Getters para templates
  get hasChanges(): boolean {
    return this.stats.additions > 0 || this.stats.deletions > 0;
  }

  get isNetAddition(): boolean {
    return this.stats.netChange > 0;
  }

  get isNetDeletion(): boolean {
    return this.stats.netChange < 0;
  }

  get changeIntensity(): 'low' | 'medium' | 'high' {
    if (this.stats.changePercentage < 20) return 'low';
    if (this.stats.changePercentage < 50) return 'medium';
    return 'high';
  }

  get statusIcon(): string {
    if (!this.fileComparison) return 'help';
    
    switch (this.fileComparison.status) {
      case 'added': return 'add_circle';
      case 'deleted': return 'remove_circle';
      case 'modified': return 'edit';
      case 'renamed': return 'drive_file_rename_outline';
      case 'copied': return 'content_copy';
      default: return 'description';
    }
  }

  get statusColor(): string {
    if (!this.fileComparison) return 'default';
    
    switch (this.fileComparison.status) {
      case 'added': return 'success';
      case 'deleted': return 'error';
      case 'modified': return 'warning';
      case 'renamed': return 'primary';
      case 'copied': return 'secondary';
      default: return 'default';
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getAdditionsPercentage(): number {
    const total = this.stats.additions + this.stats.deletions;
    return total > 0 ? (this.stats.additions / total) * 100 : 0;
  }

  getDeletionsPercentage(): number {
    const total = this.stats.additions + this.stats.deletions;
    return total > 0 ? (this.stats.deletions / total) * 100 : 0;
  }
}
