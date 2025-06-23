import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services and Models
import { GitService } from '../../../core/services/git.service';
import { GitRef, GitRefType, GitRepository } from '../../models';

interface CommitSelection {
  ref: GitRef | null;
  type: 'A' | 'B';
  label: string;
}

@Component({
  selector: 'app-commit-picker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './commit-picker.component.html',
  styleUrls: ['./commit-picker.component.scss']
})
export class CommitPickerComponent implements OnInit, OnDestroy {
  @Input() repository: GitRepository | null = null;
  @Input() refs: GitRef[] = [];
  @Input() loading: boolean = false;

  @Output() commitASelected = new EventEmitter<GitRef>();
  @Output() commitBSelected = new EventEmitter<GitRef>();
  @Output() comparisonRequested = new EventEmitter<{ fromRef: string; toRef: string; fromName: string; toName: string }>();
  @Output() selectionChanged = new EventEmitter<{ commitA: GitRef | null; commitB: GitRef | null }>();

  private destroy$ = new Subject<void>();

  commitAControl = new FormControl<GitRef | null>(null, [Validators.required]);
  commitBControl = new FormControl<GitRef | null>(null, [Validators.required]);
  
  allRefs: GitRef[] = [];
  groupedRefs: { label: string; refs: GitRef[] }[] = [];

  constructor(private gitService: GitService) {}

  ngOnInit() {
    // Usar refs se já foram fornecidas
    if (this.refs.length > 0) {
      this.allRefs = this.refs;
      this.groupRefs();
    }

    // Monitorar mudanças nas seleções
    this.commitAControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((value) => {
      if (value) {
        this.commitASelected.emit(value);
      }
      this.emitSelectionChange();
    });

    this.commitBControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((value) => {
      if (value) {
        this.commitBSelected.emit(value);
      }
      this.emitSelectionChange();
    });

    // Carregar refs se repository está disponível e refs não foram fornecidas
    if (this.repository && this.refs.length === 0) {
      this.loadRefs();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges() {
    if (this.repository) {
      this.loadRefs();
    }
  }

  private loadRefs() {
    this.loading = true;
    this.allRefs = [];
    this.groupedRefs = [];

    this.gitService.getAllRefs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (refs) => {
          this.allRefs = refs;
          this.groupRefs();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar refs:', error);
          this.loading = false;
        }
      });
  }

  private groupRefs() {
    const branches = this.allRefs.filter(ref => ref.type === GitRefType.BRANCH);
    const tags = this.allRefs.filter(ref => ref.type === GitRefType.TAG);
    const commits = this.allRefs.filter(ref => ref.type === GitRefType.COMMIT);

    this.groupedRefs = [
      { label: 'Branches', refs: branches },
      { label: 'Tags', refs: tags },
      { label: 'Commits Recentes', refs: commits }
    ].filter(group => group.refs.length > 0);
  }

  private emitSelectionChange() {
    this.selectionChanged.emit({
      commitA: this.commitAControl.value,
      commitB: this.commitBControl.value
    });
  }

  compareRefs(ref1: GitRef, ref2: GitRef): boolean {
    return ref1 && ref2 ? ref1.hash === ref2.hash : ref1 === ref2;
  }

  getRefIcon(type: GitRefType): string {
    switch (type) {
      case GitRefType.BRANCH:
        return 'call_split';
      case GitRefType.TAG:
        return 'local_offer';
      case GitRefType.COMMIT:
        return 'commit';
      default:
        return 'help';
    }
  }

  formatHash(hash: string): string {
    return hash.substring(0, 8);
  }

  canCompare(): boolean {
    return !!(this.commitAControl.value && this.commitBControl.value && 
             this.commitAControl.value.hash !== this.commitBControl.value.hash);
  }

  clearSelection(type: 'A' | 'B') {
    if (type === 'A') {
      this.commitAControl.setValue(null);
    } else {
      this.commitBControl.setValue(null);
    }
  }

  clearAllSelections() {
    this.commitAControl.setValue(null);
    this.commitBControl.setValue(null);
  }

  swapSelections() {
    const tempA = this.commitAControl.value;
    const tempB = this.commitBControl.value;
    
    this.commitAControl.setValue(tempB);
    this.commitBControl.setValue(tempA);
  }

  performComparison() {
    if (this.canCompare()) {
      const commitA = this.commitAControl.value!;
      const commitB = this.commitBControl.value!;
      
      this.comparisonRequested.emit({
        fromRef: commitA.hash,
        toRef: commitB.hash,
        fromName: commitA.displayName,
        toName: commitB.displayName
      });
    }
  }

  // Quick actions
  compareWithPrevious() {
    const commits = this.allRefs.filter(ref => ref.type === GitRefType.COMMIT);
    if (commits.length >= 2) {
      this.commitAControl.setValue(commits[1]); // Previous
      this.commitBControl.setValue(commits[0]); // Latest
    }
  }

  compareHeadWithMain() {
    const branches = this.allRefs.filter(ref => ref.type === GitRefType.BRANCH);
    const head = branches.find(b => b.name === 'HEAD' || b.name.includes('HEAD'));
    const main = branches.find(b => b.name === 'main' || b.name === 'master');
    
    if (head && main) {
      this.commitAControl.setValue(main);
      this.commitBControl.setValue(head);
    }
  }

  compareWithTags() {
    const tags = this.allRefs.filter(ref => ref.type === GitRefType.TAG);
    if (tags.length >= 2) {
      this.commitAControl.setValue(tags[1]); // Previous tag
      this.commitBControl.setValue(tags[0]); // Latest tag
    }
  }

  hasCommits(): boolean {
    return this.allRefs.some(ref => ref.type === GitRefType.COMMIT);
  }

  hasBranches(): boolean {
    return this.allRefs.some(ref => ref.type === GitRefType.BRANCH);
  }

  hasTags(): boolean {
    return this.allRefs.some(ref => ref.type === GitRefType.TAG);
  }
}
