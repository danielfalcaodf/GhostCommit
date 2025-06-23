import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';

import { GitCompareComponent } from './git-compare.component';
import { GitService } from '../../core/services/git.service';
import { NotificationService } from '../../core/services/notification.service';
import { GitRepository, GitRef, GitComparisonResult, GitFileComparison, GitRefType, GitFileStatus, GitFileDiff } from '../../shared/models';

describe('GitCompareComponent', () => {
  let component: GitCompareComponent;
  let fixture: ComponentFixture<GitCompareComponent>;
  let gitServiceSpy: jasmine.SpyObj<GitService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  const mockRepository: GitRepository = {
    path: '/test/repo',
    name: 'test-repo',
    current_branch: 'main',
    total_commits: 100,
    size: '1.2MB',
    remotes: ['origin'],
    is_bare: false,
    has_untracked: false,
    has_staged: false,
    has_unstaged: false,
    isClean: true
  };

  const mockRefs: GitRef[] = [
    {
      name: 'main',
      hash: 'abc123',
      type: GitRefType.BRANCH,
      display_name: 'main'
    },
    {
      name: 'develop',
      hash: 'def456',
      type: GitRefType.BRANCH,
      display_name: 'develop'
    }
  ];

  const mockComparisonResult: GitComparisonResult = {
    from_ref: 'abc123',
    to_ref: 'def456',
    diff: {
      patch: '',
      stats: {
        total_files: 1,
        total_insertions: 5,
        total_deletions: 3,
        files_added: 0,
        files_deleted: 0,
        files_modified: 1,
        files_renamed: 0,
        files_copied: 0
      },
      files: [
        {
          new_path: 'test.js',
          old_path: 'test.js',
          status: GitFileStatus.MODIFIED,
          binary: false,
          hunks: [],
          insertions: 5,
          deletions: 3
        }
      ]
    },
    stats: {
      total_files: 1,
      total_insertions: 5,
      total_deletions: 3,
      files_added: 0,
      files_deleted: 0,
      files_modified: 1,
      files_renamed: 0,
      files_copied: 0
    },
    files: [GitFileStatus.MODIFIED],
    commits_between: []
  };

  beforeEach(async () => {
    const gitSpy = jasmine.createSpyObj('GitService', [
      'getCurrentRepository',
      'openRepository',
      'getAllRefs',
      'compareCommits',
      'getFileComparison'
    ]);
    const notificationSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        GitCompareComponent,
        NoopAnimationsModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatExpansionModule,
        MatChipsModule
      ],
      providers: [
        { provide: GitService, useValue: gitSpy },
        { provide: NotificationService, useValue: notificationSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GitCompareComponent);
    component = fixture.componentInstance;
    gitServiceSpy = TestBed.inject(GitService) as jasmine.SpyObj<GitService>;
    notificationServiceSpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current repository if available', () => {
    gitServiceSpy.getCurrentRepository.and.returnValue(mockRepository);
    gitServiceSpy.getAllRefs.and.returnValue(of(mockRefs));

    component.ngOnInit();

    expect(component.currentRepository).toEqual(mockRepository);
    expect(component.repositoryPath).toBe(mockRepository.path);
  });

  it('should load repository successfully', async () => {
    component.repositoryPath = '/test/repo';
    gitServiceSpy.openRepository.and.returnValue(of(mockRepository));
    gitServiceSpy.getAllRefs.and.returnValue(of(mockRefs));

    await component.loadRepository();

    expect(component.currentRepository).toEqual(mockRepository);
    expect(component.refs).toEqual(mockRefs);
    expect(notificationServiceSpy.showSuccess).toHaveBeenCalled();
  });

  it('should handle repository loading error', async () => {
    component.repositoryPath = '/invalid/repo';
    gitServiceSpy.openRepository.and.returnValue(throwError({ message: 'Repository not found' }));

    await component.loadRepository();

    expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Erro ao carregar repositório: Repository not found');
  });

  it('should compare commits successfully', async () => {
    component.selectedRefA = 'abc123';
    component.selectedRefB = 'def456';
    gitServiceSpy.compareCommits.and.returnValue(of(mockComparisonResult));

    await component.compareCommits();

    expect(component.comparisonResult).toEqual(mockComparisonResult);
    expect(component.filteredFiles).toEqual(mockComparisonResult.diff.files);
    expect(notificationServiceSpy.showSuccess).toHaveBeenCalled();
  });

  it('should handle comparison error', async () => {
    component.selectedRefA = 'abc123';
    component.selectedRefB = 'def456';
    gitServiceSpy.compareCommits.and.returnValue(throwError({ message: 'Comparison failed' }));

    await component.compareCommits();

    expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Erro na comparação: Comparison failed');
  });

  it('should filter files by search term', () => {
    component.comparisonResult = mockComparisonResult;
    component.searchTerm = 'test';

    component.onSearchChange();

    expect(component.filteredFiles).toEqual(mockComparisonResult.diff.files);
  });

  it('should filter files by status', () => {
    component.comparisonResult = mockComparisonResult;
    component.statusFilter = 'modified';

    component.onStatusFilterChange();

    expect(component.filteredFiles).toEqual(mockComparisonResult.diff.files);
  });

  it('should clear filters', () => {
    component.comparisonResult = mockComparisonResult;
    component.searchTerm = 'test';
    component.statusFilter = 'modified';

    component.clearFilters();

    expect(component.searchTerm).toBe('');
    expect(component.statusFilter).toBe('');
    expect(component.filteredFiles).toEqual(mockComparisonResult.diff.files);
  });

  it('should check if can compare', () => {
    component.selectedRefA = '';
    component.selectedRefB = '';
    expect(component.canCompare()).toBeFalse();

    component.selectedRefA = 'abc123';
    component.selectedRefB = 'def456';
    expect(component.canCompare()).toBeTrue();

    component.selectedRefB = 'abc123'; // Same ref
    expect(component.canCompare()).toBeFalse();
  });

  it('should get correct ref icon', () => {
    expect(component.getRefIcon(GitRefType.BRANCH)).toBe('call_split');
    expect(component.getRefIcon(GitRefType.TAG)).toBe('local_offer');
    expect(component.getRefIcon(GitRefType.COMMIT)).toBe('commit');
  });

  it('should get correct file status icon', () => {
    expect(component.getFileStatusIcon('added')).toBe('add');
    expect(component.getFileStatusIcon('modified')).toBe('edit');
    expect(component.getFileStatusIcon('deleted')).toBe('remove');
    expect(component.getFileStatusIcon('renamed')).toBe('drive_file_move');
  });

  it('should export comparison in different formats', () => {
    component.comparisonResult = mockComparisonResult;
    component.selectedRefA = 'main';
    component.selectedRefB = 'develop';

    spyOn(component as any, 'downloadFile');

    component.exportComparison('html');
    expect((component as any).downloadFile).toHaveBeenCalled();

    component.exportComparison('markdown');
    expect((component as any).downloadFile).toHaveBeenCalled();

    component.exportComparison('text');
    expect((component as any).downloadFile).toHaveBeenCalled();
  });

  it('should handle export error when no comparison result', () => {
    component.comparisonResult = null;

    component.exportComparison('html');

    expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Nenhuma comparação para exportar');
  });
});
