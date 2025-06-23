import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models
import { GitDiffFile } from '../../models';

export interface DiffFilters {
  authors: string[];
  fileExtensions: string[];
  dateFrom?: Date;
  dateTo?: Date;
  searchText?: string;
  searchType: 'content' | 'pickaxe' | 'grep';
  onlyModified: boolean;
  onlyAdded: boolean;
  onlyDeleted: boolean;
  onlyRenamed: boolean;
  minLines?: number;
  maxLines?: number;
}

@Component({
  selector: 'app-diff-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatTooltipModule
  ],
  templateUrl: './diff-filters.component.html',
  styleUrls: ['./diff-filters.component.scss']
})
export class DiffFiltersComponent implements OnInit, OnDestroy {
  @Input() availableAuthors: string[] = [];
  @Input() availableExtensions: string[] = [];
  @Input() files: GitDiffFile[] = [];
  
  @Output() filtersChanged = new EventEmitter<DiffFilters>();
  @Output() filtersApplied = new EventEmitter<DiffFilters>();

  private destroy$ = new Subject<void>();

  filtersForm = new FormGroup({
    authorInput: new FormControl(''),
    extensionInput: new FormControl(''),
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null),
    searchText: new FormControl(''),
    searchType: new FormControl<'content' | 'pickaxe' | 'grep'>('content'),
    onlyModified: new FormControl(false),
    onlyAdded: new FormControl(false),
    onlyDeleted: new FormControl(false),
    onlyRenamed: new FormControl(false),
    minLines: new FormControl<number | null>(null),
    maxLines: new FormControl<number | null>(null)
  });

  selectedAuthors: string[] = [];
  selectedExtensions: string[] = [];

  ngOnInit() {
    // Monitorar mudanças nos filtros
    this.filtersForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.emitFilters();
    });

    // Extrair extensões dos arquivos
    this.extractExtensionsFromFiles();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private extractExtensionsFromFiles() {
    if (this.files.length === 0) return;

    const extensions = new Set<string>();
    this.files.forEach(file => {
      const extension = file.path.split('.').pop();
      if (extension && extension !== file.path) {
        extensions.add(extension);
      }
    });

    this.availableExtensions = Array.from(extensions).sort();
  }

  addAuthor(author: string) {
    if (author && !this.selectedAuthors.includes(author)) {
      this.selectedAuthors.push(author);
      this.filtersForm.patchValue({ authorInput: '' });
      this.emitFilters();
    }
  }

  removeAuthor(author: string) {
    const index = this.selectedAuthors.indexOf(author);
    if (index >= 0) {
      this.selectedAuthors.splice(index, 1);
      this.emitFilters();
    }
  }

  addExtension(extension: string) {
    if (extension && !this.selectedExtensions.includes(extension)) {
      this.selectedExtensions.push(extension);
      this.filtersForm.patchValue({ extensionInput: '' });
      this.emitFilters();
    }
  }

  removeExtension(extension: string) {
    const index = this.selectedExtensions.indexOf(extension);
    if (index >= 0) {
      this.selectedExtensions.splice(index, 1);
      this.emitFilters();
    }
  }

  clearSearchText() {
    this.filtersForm.patchValue({ searchText: '' });
  }

  applyFilters() {
    const filters = this.getCurrentFilters();
    this.filtersApplied.emit(filters);
  }

  clearFilters() {
    this.filtersForm.reset({
      searchType: 'content',
      onlyModified: false,
      onlyAdded: false,
      onlyDeleted: false,
      onlyRenamed: false
    });
    this.selectedAuthors = [];
    this.selectedExtensions = [];
    this.emitFilters();
  }

  savePreset() {
    const filters = this.getCurrentFilters();
    // Implementar salvamento de preset
    console.log('Saving preset:', filters);
  }

  getActiveFiltersCount(): number {
    let count = 0;
    count += this.selectedAuthors.length;
    count += this.selectedExtensions.length;
    
    const form = this.filtersForm.value;
    if (form.dateFrom) count++;
    if (form.dateTo) count++;
    if (form.searchText) count++;
    if (form.onlyModified) count++;
    if (form.onlyAdded) count++;
    if (form.onlyDeleted) count++;
    if (form.onlyRenamed) count++;
    if (form.minLines) count++;
    if (form.maxLines) count++;

    return count;
  }

  hasActiveFilters(): boolean {
    return this.getActiveFiltersCount() > 0;
  }

  private getCurrentFilters(): DiffFilters {
    const form = this.filtersForm.value;
    return {
      authors: [...this.selectedAuthors],
      fileExtensions: [...this.selectedExtensions],
      dateFrom: form.dateFrom || undefined,
      dateTo: form.dateTo || undefined,
      searchText: form.searchText || undefined,
      searchType: form.searchType || 'content',
      onlyModified: form.onlyModified || false,
      onlyAdded: form.onlyAdded || false,
      onlyDeleted: form.onlyDeleted || false,
      onlyRenamed: form.onlyRenamed || false,
      minLines: form.minLines || undefined,
      maxLines: form.maxLines || undefined
    };
  }

  private emitFilters() {
    const filters = this.getCurrentFilters();
    this.filtersChanged.emit(filters);
  }
}
