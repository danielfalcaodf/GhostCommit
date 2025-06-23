import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Inject } from '@angular/core';

// Models
import { GitDiff, GitFileComparison, GitComparisonResult } from '../../models';

export interface ExportOptions {
  format: 'patch' | 'markdown' | 'html' | 'json';
  includeStats: boolean;
  includeFileList: boolean;
  includeDiffs: boolean;
  includeBlame: boolean;
  selectedFilesOnly: boolean;
  customTemplate?: string;
}

export interface ExportDialogData {
  comparisonResult: GitComparisonResult;
  selectedFiles: string[];
}

@Component({
  selector: 'app-export-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule
  ],
  templateUrl: './export-dialog.component.html',
  styleUrls: ['./export-dialog.component.scss']
})
export class ExportDialogComponent {
  exportForm = new FormGroup({
    format: new FormControl<'patch' | 'markdown' | 'html' | 'json'>('markdown'),
    includeStats: new FormControl(true),
    includeFileList: new FormControl(true),
    includeDiffs: new FormControl(true),
    includeBlame: new FormControl(false),
    selectedFilesOnly: new FormControl(false),
    customTemplate: new FormControl('')
  });

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) {}

  cancel() {
    this.dialogRef.close();
  }

  export() {
    if (this.exportForm.valid) {
      const options: ExportOptions = {
        format: this.exportForm.value.format || 'markdown',
        includeStats: this.exportForm.value.includeStats || false,
        includeFileList: this.exportForm.value.includeFileList || false,
        includeDiffs: this.exportForm.value.includeDiffs || false,
        includeBlame: this.exportForm.value.includeBlame || false,
        selectedFilesOnly: this.exportForm.value.selectedFilesOnly || false,
        customTemplate: this.exportForm.value.customTemplate || undefined
      };

      this.dialogRef.close(options);
    }
  }
}
