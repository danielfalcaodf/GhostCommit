// Estrutura padronizada de resposta do Tauri
export interface TauriResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Interfaces principais do Git
export interface GitRepository {
  name: string;
  path: string;
  current_branch: string;
  total_commits: number;
  size: string;
  last_commit?: GitCommit;
  remotes: string[];
  is_bare: boolean;
  has_untracked: boolean;
  has_staged: boolean;
  has_unstaged: boolean;
  // Campo adicional para compatibilidade com código existente
  isClean?: boolean;
}

export interface GitCommit {
  hash: string;
  short_hash: string;
  message: string;
  author: GitAuthor;
  committer: GitAuthor;
  date: Date;
  parent_hashes: string[];
  tree_hash: string;
  stats?: GitCommitStats;
}

export interface GitAuthor {
  name: string;
  email: string;
  date: Date;
}

export interface GitCommitStats {
  files_changed: number;
  insertions: number;
  deletions: number;
}

export interface GitBranch {
  name: string;
  hash: string;
  is_current: boolean;
  is_remote: boolean;
  upstream?: string;
  ahead: number;
  behind: number;
  last_commit?: GitCommit;
}

export interface GitTag {
  name: string;
  hash: string;
  message?: string;
  tagger?: GitAuthor;
  target_type: string;
  date?: Date;
}

export interface GitRef {
  name: string;
  hash: string;
  type: GitRefType;
  display_name: string;
}

export enum GitRefType {
  COMMIT = 'commit',
  BRANCH = 'branch',
  TAG = 'tag'
}

export interface GitComparisonResult {
  from_ref: string;
  to_ref: string;
  diff: GitDiff;
  stats: GitDiffStats;
  files: GitFileStatus[];
  commits_between: GitCommit[];
}

export interface GitDiff {
  patch: string;
  stats: GitDiffStats;
  files: GitFileDiff[];
}

export interface GitDiffStats {
  total_files: number;
  total_insertions: number;
  total_deletions: number;
  files_added: number;
  files_deleted: number;
  files_modified: number;
  files_renamed: number;
  files_copied: number;
}

export interface GitFileDiff {
  old_path?: string;
  new_path?: string;
  status: GitFileStatus;
  similarity?: number;
  binary: boolean;
  hunks: GitDiffHunk[];
  old_mode?: string;
  new_mode?: string;
  old_hash?: string;
  new_hash?: string;
  // Campos adicionais para compatibilidade com código existente
  insertions?: number;
  deletions?: number;
}

export interface GitDiffHunk {
  header: string;
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  lines: GitDiffLine[];
  context?: string;
}

export interface GitDiffLine {
  content: string;
  type: GitDiffLineType;
  old_line_number?: number;
  new_line_number?: number;
}

export enum GitDiffLineType {
  CONTEXT = 'context',
  ADDED = 'added',
  DELETED = 'deleted'
}

export enum GitFileStatus {
  ADDED = 'added',
  DELETED = 'deleted',
  MODIFIED = 'modified',
  RENAMED = 'renamed',
  COPIED = 'copied',
  UNTRACKED = 'untracked',
  IGNORED = 'ignored',
  CONFLICTED = 'conflicted'
}

export interface GitFileComparison {
  old_path?: string;
  new_path?: string;
  status: GitFileStatus;
  old_content?: string;
  new_content?: string;
  diff: GitFileDiff;
  language: string;
  binary: boolean;
  size_old?: number;
  size_new?: number;
  // Campos adicionais para compatibilidade com código existente
  file?: GitDiffFile;
  hunks?: GitDiffHunk[];
}

export interface GitBlameInfo {
  file_path: string;
  lines: GitBlameLine[];
  commit_hash?: string;
}

export interface GitBlameLine {
  line_number: number;
  content: string;
  commit_hash: string;
  commit_short_hash: string;
  author: GitAuthor;
  committer: GitAuthor;
  message: string;
  date: Date;
}

export interface GitSearchResult {
  query: string;
  search_type: GitSearchType;
  results: GitSearchMatch[];
  total_matches: number;
  took_ms: number;
}

export enum GitSearchType {
  PICKAXE = 'pickaxe',
  GREP = 'grep',
  LOG = 'log'
}

export interface GitSearchMatch {
  commit: GitCommit;
  file_path?: string;
  line_number?: number;
  content?: string;
  context_before?: string[];
  context_after?: string[];
}

export interface GitRepositoryStats {
  total_commits: number;
  total_branches: number;
  total_tags: number;
  total_files: number;
  repository_size: number;
  first_commit?: GitCommit;
  latest_commit?: GitCommit;
  contributors: GitContributor[];
  activity_by_month: Record<string, number>;
  languages: Record<string, number>;
}

export interface GitContributor {
  name: string;
  email: string;
  commits: number;
  insertions: number;
  deletions: number;
  first_commit: Date;
  last_commit: Date;
}

// Aliases para compatibilidade
export type GitReference = GitRef;
export type GitCompareResult = GitComparisonResult;
export type GitBranchInfo = GitBranch;

// Interfaces para parâmetros de entrada dos comandos
export interface OpenRepositoryParams {
  path: string;
}

export interface IsValidRepositoryParams {
  path: string;
}

export interface GetCommitsParams {
  path: string;
  limit?: number;
  offset?: number;
  branch?: string;
}

export interface GetBranchesParams {
  path: string;
}

export interface GetTagsParams {
  path: string;
}

export interface CompareCommitsParams {
  path: string;
  from_ref: string;
  to_ref: string;
}

export interface GetFileComparisonParams {
  path: string;
  from_ref: string;
  to_ref: string;
  file_path: string;
}

export interface GetFileBlameParams {
  path: string;
  file_path: string;
  commit_hash?: string;
}

export interface GetFileContentParams {
  path: string;
  file_path: string;
  commit_hash: string;
}

export interface GetRepositoryStatsParams {
  path: string;
}

export interface SearchHistoryParams {
  path: string;
  query: string;
  search_type: GitSearchType;
  file_pattern?: string;
  max_results?: number;
  context_lines?: number;
}

export interface ListReferencesParams {
  repo_path: string;
}

export interface GetFileDiffParams {
  repo_path: string;
  commit1: string;
  commit2: string;
  file_path: string;
}

export interface SearchCodeParams {
  repo_path: string;
  query: string;
  commit_hash?: string;
  max_results?: number;
  context_lines?: number;
}

export interface GetCommitStatsParams {
  repo_path: string;
  commit_hash: string;
}

export interface GetBranchInfoParams {
  repo_path: string;
}

export interface ExportReportParams {
  repo_path: string;
  from_ref: string;
  to_ref: string;
  format: string;
  output_path: string;
}

// Interfaces legadas mantidas para compatibilidade com código existente
export interface GitDiffFile {
  new_path: string;
  old_path?: string;
  status: 'added' | 'deleted' | 'modified' | 'renamed' | 'copied';
  insertions: number;
  deletions: number;
  is_binary: boolean;
}
