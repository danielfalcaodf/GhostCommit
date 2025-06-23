use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TauriResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> TauriResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(error: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRepository {
    pub name: String,
    pub path: String,
    pub current_branch: String,
    pub total_commits: u32,
    pub size: String,
    pub last_commit: Option<GitCommit>,
    pub remotes: Vec<String>,
    pub is_bare: bool,
    pub has_untracked: bool,
    pub has_staged: bool,
    pub has_unstaged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    pub short_hash: String,
    pub message: String,
    pub author: GitAuthor,
    pub committer: GitAuthor,
    pub date: DateTime<Utc>,
    pub parent_hashes: Vec<String>,
    pub tree_hash: String,
    pub stats: Option<GitCommitStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitAuthor {
    pub name: String,
    pub email: String,
    pub date: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommitStats {
    pub files_changed: u32,
    pub insertions: u32,
    pub deletions: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
    pub hash: String,
    pub is_current: bool,
    pub is_remote: bool,
    pub upstream: Option<String>,
    pub ahead: u32,
    pub behind: u32,
    pub last_commit: Option<GitCommit>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitTag {
    pub name: String,
    pub hash: String,
    pub message: Option<String>,
    pub tagger: Option<GitAuthor>,
    pub target_type: String,
    pub date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRef {
    pub name: String,
    pub hash: String,
    #[serde(rename = "type")]
    pub ref_type: GitRefType,
    pub display_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GitRefType {
    #[serde(rename = "commit")]
    Commit,
    #[serde(rename = "branch")]
    Branch,
    #[serde(rename = "tag")]
    Tag,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitComparisonResult {
    pub from_ref: String,
    pub to_ref: String,
    pub diff: GitDiff,
    pub stats: GitDiffStats,
    pub files: Vec<GitFileStatus>,
    pub commits_between: Vec<GitCommit>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitDiff {
    pub patch: String,
    pub stats: GitDiffStats,
    pub files: Vec<GitFileDiff>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitDiffStats {
    pub total_files: u32,
    pub total_insertions: u32,
    pub total_deletions: u32,
    pub files_added: u32,
    pub files_deleted: u32,
    pub files_modified: u32,
    pub files_renamed: u32,
    pub files_copied: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitFileDiff {
    pub old_path: Option<String>,
    pub new_path: Option<String>,
    pub status: GitFileStatus,
    pub similarity: Option<u32>,
    pub binary: bool,
    pub hunks: Vec<GitDiffHunk>,
    pub old_mode: Option<String>,
    pub new_mode: Option<String>,
    pub old_hash: Option<String>,
    pub new_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitDiffHunk {
    pub header: String,
    pub old_start: u32,
    pub old_lines: u32,
    pub new_start: u32,
    pub new_lines: u32,
    pub lines: Vec<GitDiffLine>,
    pub context: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitDiffLine {
    pub content: String,
    #[serde(rename = "type")]
    pub line_type: GitDiffLineType,
    pub old_line_number: Option<u32>,
    pub new_line_number: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GitDiffLineType {
    #[serde(rename = "context")]
    Context,
    #[serde(rename = "added")]
    Added,
    #[serde(rename = "deleted")]
    Deleted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GitFileStatus {
    #[serde(rename = "added")]
    Added,
    #[serde(rename = "deleted")]
    Deleted,
    #[serde(rename = "modified")]
    Modified,
    #[serde(rename = "renamed")]
    Renamed,
    #[serde(rename = "copied")]
    Copied,
    #[serde(rename = "untracked")]
    Untracked,
    #[serde(rename = "ignored")]
    Ignored,
    #[serde(rename = "conflicted")]
    Conflicted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitFileComparison {
    pub old_path: Option<String>,
    pub new_path: Option<String>,
    pub status: GitFileStatus,
    pub old_content: Option<String>,
    pub new_content: Option<String>,
    pub diff: GitFileDiff,
    pub language: String,
    pub binary: bool,
    pub size_old: Option<u64>,
    pub size_new: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBlameInfo {
    pub file_path: String,
    pub lines: Vec<GitBlameLine>,
    pub commit_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBlameLine {
    pub line_number: u32,
    pub content: String,
    pub commit_hash: String,
    pub commit_short_hash: String,
    pub author: GitAuthor,
    pub committer: GitAuthor,
    pub message: String,
    pub date: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitSearchResult {
    pub query: String,
    pub search_type: GitSearchType,
    pub results: Vec<GitSearchMatch>,
    pub total_matches: u32,
    pub took_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GitSearchType {
    #[serde(rename = "pickaxe")]
    Pickaxe,
    #[serde(rename = "grep")]
    Grep,
    #[serde(rename = "log")]
    Log,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitSearchMatch {
    pub commit: GitCommit,
    pub file_path: Option<String>,
    pub line_number: Option<u32>,
    pub content: Option<String>,
    pub context_before: Option<Vec<String>>,
    pub context_after: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRepositoryStats {
    pub total_commits: u32,
    pub total_branches: u32,
    pub total_tags: u32,
    pub total_files: u32,
    pub repository_size: u64,
    pub first_commit: Option<GitCommit>,
    pub latest_commit: Option<GitCommit>,
    pub contributors: Vec<GitContributor>,
    pub activity_by_month: HashMap<String, u32>,
    pub languages: HashMap<String, u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitContributor {
    pub name: String,
    pub email: String,
    pub commits: u32,
    pub insertions: u32,
    pub deletions: u32,
    pub first_commit: DateTime<Utc>,
    pub last_commit: DateTime<Utc>,
}

// Aliases para compatibilidade
pub type GitReference = GitRef;
pub type GitCompareResult = GitComparisonResult;
pub type GitBranchInfo = GitBranch;

// Estruturas para parâmetros de entrada dos comandos
#[derive(Debug, Deserialize)]
pub struct OpenRepositoryParams {
    pub path: String,
}

#[derive(Debug, Deserialize)]
pub struct IsValidRepositoryParams {
    pub path: String,
}

#[derive(Debug, Deserialize)]
pub struct GetCommitsParams {
    pub path: String,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
    pub branch: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetBranchesParams {
    pub path: String,
}

#[derive(Debug, Deserialize)]
pub struct GetTagsParams {
    pub path: String,
}

#[derive(Debug, Deserialize)]
pub struct CompareCommitsParams {
    pub path: String,
    pub from_ref: String,
    pub to_ref: String,
}

#[derive(Debug, Deserialize)]
pub struct GetFileComparisonParams {
    pub path: String,
    pub from_ref: String,
    pub to_ref: String,
    pub file_path: String,
}

#[derive(Debug, Deserialize)]
pub struct GetFileBlameParams {
    pub path: String,
    pub file_path: String,
    pub commit_hash: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetFileContentParams {
    pub path: String,
    pub file_path: String,
    pub commit_hash: String,
}

#[derive(Debug, Deserialize)]
pub struct GetRepositoryStatsParams {
    pub path: String,
}

#[derive(Debug, Deserialize)]
pub struct SearchHistoryParams {
    pub path: String,
    pub query: String,
    pub search_type: GitSearchType,
    pub file_pattern: Option<String>,
    pub max_results: Option<u32>,
    pub context_lines: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct ListReferencesParams {
    pub repo_path: String,
}

#[derive(Debug, Deserialize)]
pub struct GetFileDiffParams {
    pub repo_path: String,
    pub commit1: String,
    pub commit2: String,
    pub file_path: String,
}

#[derive(Debug, Deserialize)]
pub struct SearchCodeParams {
    pub repo_path: String,
    pub query: String,
    pub commit_hash: Option<String>,
    pub max_results: Option<u32>,
    pub context_lines: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct GetCommitStatsParams {
    pub repo_path: String,
    pub commit_hash: String,
}

#[derive(Debug, Deserialize)]
pub struct GetBranchInfoParams {
    pub repo_path: String,
}

#[derive(Debug, Deserialize)]
pub struct ExportReportParams {
    pub repo_path: String,
    pub from_ref: String,
    pub to_ref: String,
    pub format: String,
    pub output_path: String,
}
