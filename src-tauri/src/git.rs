use git2::{
    Repository, Commit, Branch, BranchType, Oid, ObjectType,
    DiffOptions, DiffFormat, Time, Signature, Tree, Diff,
    BlameOptions, StatusOptions, Status as Git2Status
};
use chrono::{DateTime, Utc, TimeZone};
use std::path::Path;
use std::collections::HashMap;
use anyhow::{Result, Context, anyhow};
use regex::Regex;
use html_escape;
use crate::models::*;

pub struct GitManager {
    repositories: HashMap<String, Repository>,
}

impl GitManager {
    pub fn new() -> Self {
        Self {
            repositories: HashMap::new(),
        }
    }

    pub fn open_repository(&mut self, path: &str) -> Result<GitRepository> {
        let repo_path = Path::new(path);
        if !repo_path.exists() {
            return Err(anyhow!("Caminho não encontrado: {}", path));
        }

        let repo = Repository::open(repo_path)
            .with_context(|| format!("Falha ao abrir repositório em: {}", path))?;

        // Obter informações básicas do repositório
        let name = repo_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Repositório")
            .to_string();

        let head = repo.head().ok();
        let current_branch = head
            .as_ref()
            .and_then(|h| h.shorthand())
            .unwrap_or("HEAD")
            .to_string();

        // Contar commits
        let mut revwalk = repo.revwalk()?;
        revwalk.push_head()?;
        let total_commits = revwalk.count() as u32;

        // Obter último commit
        let last_commit = head
            .and_then(|h| h.target())
            .and_then(|oid| repo.find_commit(oid).ok())
            .map(|commit| self.commit_to_git_commit(&commit))
            .transpose()?;

        // Obter remotes
        let remotes = repo.remotes()?
            .iter()
            .filter_map(|r| r)
            .map(|r| r.to_string())
            .collect();

        // Verificar status antes de mover o repo
        let mut status_options = StatusOptions::new();
        status_options.include_untracked(true);
        let statuses = repo.statuses(Some(&mut status_options))?;

        let has_untracked = statuses.iter().any(|s| s.status().contains(Git2Status::WT_NEW));
        let has_staged = statuses.iter().any(|s| s.status().contains(Git2Status::INDEX_NEW | Git2Status::INDEX_MODIFIED | Git2Status::INDEX_DELETED));
        let has_unstaged = statuses.iter().any(|s| s.status().contains(Git2Status::WT_MODIFIED | Git2Status::WT_DELETED));

        // Calcular tamanho do repositório (aproximado)
        let size = self.calculate_repo_size(repo_path)?;

        let git_repo = GitRepository {
            name: name.clone(),
            path: path.to_string(),
            current_branch,
            total_commits,
            size,
            last_commit,
            remotes,
            is_bare: repo.is_bare(),
            has_untracked,
            has_staged,
            has_unstaged,
        };

        // Armazenar repositório em cache - criar nova instância
        let repo_for_cache = Repository::open(repo_path)?;
        self.repositories.insert(path.to_string(), repo_for_cache);

        Ok(git_repo)
    }

    pub fn is_valid_repository(&self, path: &str) -> Result<bool> {
        let repo_path = Path::new(path);
        if !repo_path.exists() {
            return Ok(false);
        }

        match Repository::open(repo_path) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    pub fn get_commits(&self, path: &str, limit: Option<u32>, offset: Option<u32>, branch: Option<String>) -> Result<Vec<GitCommit>> {
        let repo = self.get_repository(path)?;
        let mut revwalk = repo.revwalk()?;

        // Configurar o ponto de partida
        match branch {
            Some(branch_name) => {
                let branch_ref = format!("refs/heads/{}", branch_name);
                if let Ok(oid) = repo.refname_to_id(&branch_ref) {
                    revwalk.push(oid)?;
                } else {
                    revwalk.push_head()?;
                }
            }
            None => revwalk.push_head()?,
        }

        let offset = offset.unwrap_or(0);
        let limit = limit.unwrap_or(100);

        let commits: Result<Vec<GitCommit>> = revwalk
            .skip(offset as usize)
            .take(limit as usize)
            .map(|oid| {
                let oid = oid?;
                let commit = repo.find_commit(oid)?;
                self.commit_to_git_commit(&commit)
            })
            .collect();

        commits
    }

    pub fn get_branches(&self, path: &str) -> Result<Vec<GitBranch>> {
        let repo = self.get_repository(path)?;
        let mut branches = Vec::new();

        // Branches locais
        let local_branches = repo.branches(Some(BranchType::Local))?;
        for branch_result in local_branches {
            let (branch, _branch_type) = branch_result?;
            if let Some(git_branch) = self.branch_to_git_branch(&repo, &branch, false)? {
                branches.push(git_branch);
            }
        }

        // Branches remotas
        let remote_branches = repo.branches(Some(BranchType::Remote))?;
        for branch_result in remote_branches {
            let (branch, _branch_type) = branch_result?;
            if let Some(git_branch) = self.branch_to_git_branch(&repo, &branch, true)? {
                branches.push(git_branch);
            }
        }

        Ok(branches)
    }

    pub fn get_tags(&self, path: &str) -> Result<Vec<GitTag>> {
        let repo = self.get_repository(path)?;
        let mut tags = Vec::new();

        repo.tag_foreach(|oid, name_bytes| {
            if let Ok(name) = std::str::from_utf8(name_bytes) {
                if let Ok(tag_obj) = repo.find_object(oid, Some(ObjectType::Any)) {
                    let tag_name = name.strip_prefix("refs/tags/").unwrap_or(name);
                    
                    let git_tag = match tag_obj.kind() {
                        Some(ObjectType::Tag) => {
                            // Tag anotada
                            if let Ok(tag) = tag_obj.peel_to_tag() {
                                let tagger_clone = tag.tagger().map(|sig| signature_to_git_author(&sig));
                                let message = tag.message().map(|m| m.to_string());
                                let target_oid = tag.target_id();
                                
                                GitTag {
                                    name: tag_name.to_string(),
                                    hash: target_oid.to_string(),
                                    message,
                                    tagger: tagger_clone.clone(),
                                    target_type: "commit".to_string(),
                                    date: tagger_clone.as_ref().map(|t| t.date),
                                }
                            } else {
                                return true; // Continue iteração
                            }
                        }
                        _ => {
                            // Tag leve (lightweight)
                            GitTag {
                                name: tag_name.to_string(),
                                hash: oid.to_string(),
                                message: None,
                                tagger: None,
                                target_type: "commit".to_string(),
                                date: None,
                            }
                        }
                    };
                    
                    tags.push(git_tag);
                }
            }
            true // Continue iteração
        })?;

        // Ordenar tags por nome
        tags.sort_by(|a, b| a.name.cmp(&b.name));

        Ok(tags)
    }

    pub fn compare_commits(&self, path: &str, from_ref: &str, to_ref: &str) -> Result<GitComparisonResult> {
        let repo = self.get_repository(path)?;
        
        let from_oid = self.resolve_ref(&repo, from_ref)?;
        let to_oid = self.resolve_ref(&repo, to_ref)?;
        
        let from_commit = repo.find_commit(from_oid)?;
        let to_commit = repo.find_commit(to_oid)?;
        
        let from_tree = from_commit.tree()?;
        let to_tree = to_commit.tree()?;

        // Criar diff
        let mut diff_options = DiffOptions::new();
        diff_options.context_lines(3);
        diff_options.interhunk_lines(1);
        
        let diff = repo.diff_tree_to_tree(Some(&from_tree), Some(&to_tree), Some(&mut diff_options))?;

        // Gerar patch
        let mut patch = String::new();
        diff.print(DiffFormat::Patch, |_delta, _hunk, line| {
            patch.push_str(&String::from_utf8_lossy(line.content()));
            true
        })?;

        // Coletar estatísticas
        let stats = diff.stats()?;
        let diff_stats = GitDiffStats {
            total_files: stats.files_changed() as u32,
            total_insertions: stats.insertions() as u32,
            total_deletions: stats.deletions() as u32,
            files_added: 0, // Será calculado abaixo
            files_deleted: 0,
            files_modified: 0,
            files_renamed: 0,
            files_copied: 0,
        };

        // Coletar arquivos e seus status
        let mut files = Vec::new();
        let mut files_added = 0;
        let mut files_deleted = 0;
        let mut files_modified = 0;
        let mut files_renamed = 0;
        let mut files_copied = 0;

        for delta in diff.deltas() {
            let status = match delta.status() {
                git2::Delta::Added => {
                    files_added += 1;
                    GitFileStatus::Added
                }
                git2::Delta::Deleted => {
                    files_deleted += 1;
                    GitFileStatus::Deleted
                }
                git2::Delta::Modified => {
                    files_modified += 1;
                    GitFileStatus::Modified
                }
                git2::Delta::Renamed => {
                    files_renamed += 1;
                    GitFileStatus::Renamed
                }
                git2::Delta::Copied => {
                    files_copied += 1;
                    GitFileStatus::Copied
                }
                _ => GitFileStatus::Modified,
            };
            files.push(status);
        }

        let final_stats = GitDiffStats {
            files_added,
            files_deleted,
            files_modified,
            files_renamed,
            files_copied,
            ..diff_stats
        };

        // Converter diff para nossa estrutura
        let git_diff = self.diff_to_git_diff(&diff, &patch)?;

        // Obter commits entre as duas referencias
        let commits_between = self.get_commits_between(&repo, from_oid, to_oid)?;

        let final_stats_clone = final_stats.clone();

        Ok(GitComparisonResult {
            from_ref: from_ref.to_string(),
            to_ref: to_ref.to_string(),
            diff: GitDiff {
                patch,
                stats: final_stats_clone,
                files: git_diff,
            },
            stats: final_stats,
            files,
            commits_between,
        })
    }

    pub fn get_file_comparison(&self, path: &str, from_ref: &str, to_ref: &str, file_path: &str) -> Result<GitFileComparison> {
        let repo = self.get_repository(path)?;
        
        let from_oid = self.resolve_ref(&repo, from_ref)?;
        let to_oid = self.resolve_ref(&repo, to_ref)?;
        
        let from_commit = repo.find_commit(from_oid)?;
        let to_commit = repo.find_commit(to_oid)?;
        
        let from_tree = from_commit.tree()?;
        let to_tree = to_commit.tree()?;

        // Obter conteúdo dos arquivos
        let old_content = self.get_file_content_from_tree(&repo, &from_tree, file_path).ok();
        let new_content = self.get_file_content_from_tree(&repo, &to_tree, file_path).ok();

        // Criar diff específico do arquivo
        let mut diff_options = DiffOptions::new();
        diff_options.pathspec(file_path);
        
        let diff = repo.diff_tree_to_tree(Some(&from_tree), Some(&to_tree), Some(&mut diff_options))?;

        let mut git_file_diff = None;
        let mut status = GitFileStatus::Modified;

        for delta in diff.deltas() {
            status = match delta.status() {
                git2::Delta::Added => GitFileStatus::Added,
                git2::Delta::Deleted => GitFileStatus::Deleted,
                git2::Delta::Modified => GitFileStatus::Modified,
                git2::Delta::Renamed => GitFileStatus::Renamed,
                git2::Delta::Copied => GitFileStatus::Copied,
                _ => GitFileStatus::Modified,
            };

            git_file_diff = Some(self.delta_to_git_file_diff(&repo, &delta, &diff)?);
            break;
        }

        let git_file_diff = git_file_diff.unwrap_or_else(|| GitFileDiff {
            old_path: Some(file_path.to_string()),
            new_path: Some(file_path.to_string()),
            status: status.clone(),
            similarity: None,
            binary: false,
            hunks: Vec::new(),
            old_mode: None,
            new_mode: None,
            old_hash: None,
            new_hash: None,
        });

        // Detectar linguagem
        let language = self.detect_language(file_path);

        // Verificar se é binário
        let binary = self.is_binary_file(file_path);

        // Calcular tamanhos
        let size_old = old_content.as_ref().map(|c| c.len() as u64);
        let size_new = new_content.as_ref().map(|c| c.len() as u64);

        Ok(GitFileComparison {
            old_path: Some(file_path.to_string()),
            new_path: Some(file_path.to_string()),
            status,
            old_content,
            new_content,
            diff: git_file_diff,
            language,
            binary,
            size_old,
            size_new,
        })
    }

    pub fn get_file_blame(&self, path: &str, file_path: &str, commit_hash: Option<String>) -> Result<GitBlameInfo> {
        let repo = self.get_repository(path)?;
        
        let commit_hash_clone = commit_hash.clone();  
        let commit_oid = match commit_hash_clone {
            Some(ref hash) => self.resolve_ref(&repo, &hash)?,
            None => repo.head()?.target().unwrap(),
        };

        let mut blame_options = BlameOptions::new();
        if commit_hash.is_some() {
            blame_options.newest_commit(commit_oid);
        }

        let blame = repo.blame_file(Path::new(file_path), Some(&mut blame_options))?;
        let mut lines = Vec::new();

        // Obter conteúdo do arquivo
        let commit = repo.find_commit(commit_oid)?;
        let tree = commit.tree()?;
        let file_content = self.get_file_content_from_tree(&repo, &tree, file_path)?;
        let file_lines: Vec<&str> = file_content.lines().collect();

        for (line_number, line_content) in file_lines.iter().enumerate() {
            let hunk = blame.get_line(line_number + 1).ok_or_else(|| anyhow::anyhow!("Line {} not found in blame", line_number + 1))?;
            let commit = repo.find_commit(hunk.final_commit_id())?;
            
            let blame_line = GitBlameLine {
                line_number: (line_number + 1) as u32,
                content: line_content.to_string(),
                commit_hash: commit.id().to_string(),
                commit_short_hash: format!("{:.7}", commit.id()),
                author: signature_to_git_author(&commit.author()),
                committer: signature_to_git_author(&commit.committer()),
                message: commit.message().unwrap_or("").to_string(),
                date: time_to_datetime(commit.time()),
            };
            
            lines.push(blame_line);
        }

        Ok(GitBlameInfo {
            file_path: file_path.to_string(),
            lines,
            commit_hash,
        })
    }

    pub fn get_file_content(&self, path: &str, file_path: &str, commit_hash: &str) -> Result<String> {
        let repo = self.get_repository(path)?;
        let commit_oid = self.resolve_ref(&repo, commit_hash)?;
        let commit = repo.find_commit(commit_oid)?;
        let tree = commit.tree()?;
        
        self.get_file_content_from_tree(&repo, &tree, file_path)
    }

    pub fn get_repository_stats(&self, path: &str) -> Result<GitRepositoryStats> {
        let repo = self.get_repository(path)?;
        
        // Contar commits, branches e tags
        let mut revwalk = repo.revwalk()?;
        revwalk.push_head()?;
        let total_commits = revwalk.count() as u32;

        let branches = self.get_branches(path)?;
        let total_branches = branches.len() as u32;

        let tags = self.get_tags(path)?;
        let total_tags = tags.len() as u32;

        // Obter primeiro e último commit
        let mut revwalk = repo.revwalk()?;
        revwalk.push_head()?;
        let commits: Vec<_> = revwalk.collect::<Result<Vec<_>, _>>()?;
        
        let latest_commit = if let Some(oid) = commits.first() {
            Some(self.commit_to_git_commit(&repo.find_commit(*oid)?)?)
        } else {
            None
        };

        let first_commit = if let Some(oid) = commits.last() {
            Some(self.commit_to_git_commit(&repo.find_commit(*oid)?)?)
        } else {
            None
        };

        // Calcular tamanho do repositório
        let repository_size = self.calculate_repo_size_bytes(Path::new(path))?;

        // Contar arquivos (aproximado, baseado no último commit)
        let total_files = if let Ok(head) = repo.head() {
            if let Ok(commit) = repo.find_commit(head.target().unwrap()) {
                if let Ok(tree) = commit.tree() {
                    self.count_tree_entries(&repo, &tree)?
                } else {
                    0
                }
            } else {
                0
            }
        } else {
            0
        };

        // Para estatísticas mais complexas (contribuidores, atividade por mês, linguagens)
        // seria necessário um processamento mais intensivo
        let contributors = Vec::new(); // Placeholder
        let activity_by_month = HashMap::new(); // Placeholder  
        let languages = HashMap::new(); // Placeholder

        Ok(GitRepositoryStats {
            total_commits,
            total_branches,
            total_tags,
            total_files,
            repository_size,
            first_commit,
            latest_commit,
            contributors,
            activity_by_month,
            languages,
        })
    }

    pub fn search_history(&self, path: &str, query: &str, search_type: GitSearchType, file_pattern: Option<String>, max_results: Option<u32>, context_lines: Option<u32>) -> Result<GitSearchResult> {
        let repo = self.get_repository(path)?;
        let start_time = std::time::Instant::now();
        let mut results = Vec::new();
        let max_results = max_results.unwrap_or(100);

        match search_type {
            GitSearchType::Pickaxe => {
                // Busca por mudanças que adicionaram ou removeram uma string específica
                let mut revwalk = repo.revwalk()?;
                revwalk.push_head()?;

                for oid in revwalk.take(max_results as usize) {
                    let oid = oid?;
                    let commit = repo.find_commit(oid)?;
                    
                    // Verificar se o commit contém mudanças relacionadas à query
                    if self.commit_contains_pickaxe(&repo, &commit, query)? {
                        results.push(GitSearchMatch {
                            commit: self.commit_to_git_commit(&commit)?,
                            file_path: None,
                            line_number: None,
                            content: Some(query.to_string()),
                            context_before: None,
                            context_after: None,
                        });
                    }
                }
            }
            GitSearchType::Grep => {
                // Busca por conteúdo em arquivos no commit atual
                if let Ok(head) = repo.head() {
                    if let Ok(commit) = repo.find_commit(head.target().unwrap()) {
                        if let Ok(tree) = commit.tree() {
                            self.grep_tree(&repo, &tree, query, file_pattern, &mut results, max_results)?;
                        }
                    }
                }
            }
            GitSearchType::Log => {
                // Busca em mensagens de commit
                let mut revwalk = repo.revwalk()?;
                revwalk.push_head()?;

                let regex = Regex::new(&format!("(?i){}", regex::escape(query)))?;

                for oid in revwalk.take(max_results as usize) {
                    let oid = oid?;
                    let commit = repo.find_commit(oid)?;
                    
                    if let Some(message) = commit.message() {
                        if regex.is_match(message) {
                            results.push(GitSearchMatch {
                                commit: self.commit_to_git_commit(&commit)?,
                                file_path: None,
                                line_number: None,
                                content: Some(message.to_string()),
                                context_before: None,
                                context_after: None,
                            });
                        }
                    }
                }
            }
        }

        let took_ms = start_time.elapsed().as_millis() as u64;

        Ok(GitSearchResult {
            query: query.to_string(),
            search_type,
            total_matches: results.len() as u32,
            results,
            took_ms,
        })
    }

    pub fn list_references(&self, path: &str) -> Result<Vec<GitReference>> {
        let repo = self.get_repository(path)?;
        let mut refs = Vec::new();
        
        // Adicionar branches
        let branches = self.get_branches(path)?;
        for branch in branches {
            refs.push(GitReference {
                name: branch.name.clone(),
                hash: branch.hash.clone(),
                ref_type: GitRefType::Branch,
                display_name: branch.name.clone(),
            });
        }
        
        // Adicionar tags
        let tags = self.get_tags(path)?;
        for tag in tags {
            refs.push(GitReference {
                name: tag.name.clone(),
                hash: tag.hash.clone(),
                ref_type: GitRefType::Tag,
                display_name: tag.name.clone(),
            });
        }
        
        Ok(refs)
    }

    pub fn get_file_diff(&self, path: &str, from_ref: &str, to_ref: &str, file_path: &str) -> Result<GitFileDiff> {
        let comparison = self.get_file_comparison(path, from_ref, to_ref, file_path)?;
        Ok(comparison.diff)
    }

    pub fn search_code(&self, path: &str, query: &str, commit_hash: Option<String>, max_results: Option<u32>, _context_lines: Option<u32>) -> Result<GitSearchResult> {
        let repo = self.get_repository(path)?;
        let max_results = max_results.unwrap_or(100);
        
        let commit_oid = match commit_hash {
            Some(ref hash) => self.resolve_ref(&repo, hash)?,
            None => repo.head()?.target().ok_or_else(|| anyhow::anyhow!("HEAD not found"))?,
        };
        
        let commit = repo.find_commit(commit_oid)?;
        let tree = commit.tree()?;
        
        let mut results = Vec::new();
        self.grep_tree(&repo, &tree, query, None, &mut results, max_results)?;
        
        Ok(GitSearchResult {
            query: query.to_string(),
            search_type: GitSearchType::Grep,
            took_ms: 0, // TODO: medir tempo
            total_matches: results.len() as u32,
            results,
        })
    }

    pub fn get_commit_stats(&self, path: &str, commit_hash: &str) -> Result<GitCommitStats> {
        let repo = self.get_repository(path)?;
        let commit_oid = self.resolve_ref(&repo, commit_hash)?;
        let commit = repo.find_commit(commit_oid)?;
        
        if let Some(parent) = commit.parent(0).ok() {
            let diff = repo.diff_tree_to_tree(
                Some(&parent.tree()?),
                Some(&commit.tree()?),
                None,
            )?;
            
            let stats = diff.stats()?;
            
            Ok(GitCommitStats {
                files_changed: stats.files_changed() as u32,
                insertions: stats.insertions() as u32,
                deletions: stats.deletions() as u32,
            })
        } else {
            // First commit
            Ok(GitCommitStats {
                files_changed: 0,
                insertions: 0,
                deletions: 0,
            })
        }
    }

    pub fn get_branch_info(&self, path: &str) -> Result<GitBranch> {
        let repo = self.get_repository(path)?;
        let head = repo.head()?;
        
        if let Some(branch_name) = head.shorthand() {
            let branches = self.get_branches(path)?;
            for branch in branches {
                if branch.name == branch_name {
                    return Ok(branch);
                }
            }
        }
        
        Err(anyhow::anyhow!("Current branch not found"))
    }

    pub fn export_comparison_report(&self, params: &ExportReportParams) -> Result<String> {
        let repo = self.get_repository(&params.repo_path)?;
        let comparison = self.compare_commits(&params.repo_path, &params.from_ref, &params.to_ref)?;
        
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let filename = match params.format.as_str() {
            "patch" => format!("diff_{}_{}.patch", &params.from_ref[..7.min(params.from_ref.len())], &params.to_ref[..7.min(params.to_ref.len())]),
            "html" => format!("diff_report_{}.html", timestamp),
            "markdown" => format!("diff_report_{}.md", timestamp),
            _ => format!("diff_report_{}.txt", timestamp),
        };
        
        let output_path = if params.output_path.is_empty() {
            std::env::temp_dir().join(filename)
        } else {
            std::path::Path::new(&params.output_path).join(filename)
        };
        
        let content = match params.format.as_str() {
            "patch" => comparison.diff.patch,
            "html" => self.generate_html_report(&comparison)?,
            "markdown" => self.generate_markdown_report(&comparison)?,
            _ => self.generate_text_report(&comparison)?,
        };
        
        std::fs::write(&output_path, content)?;
        Ok(output_path.to_string_lossy().to_string())
    }

    fn generate_html_report(&self, comparison: &GitComparisonResult) -> Result<String> {
        let html = format!(r#"
<!DOCTYPE html>
<html>
<head>
    <title>Git Comparison Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .header {{ border-bottom: 2px solid #ddd; padding-bottom: 10px; }}
        .stats {{ background: #f5f5f5; padding: 15px; margin: 15px 0; }}
        .file {{ margin: 20px 0; border: 1px solid #ddd; }}
        .file-header {{ background: #f0f0f0; padding: 10px; font-weight: bold; }}
        .diff {{ font-family: monospace; white-space: pre-wrap; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Git Comparison Report</h1>
        <p><strong>From:</strong> {}</p>
        <p><strong>To:</strong> {}</p>
        <p><strong>Generated:</strong> {}</p>
    </div>
    
    <div class="stats">
        <h2>Summary</h2>
        <ul>
            <li>Files changed: {}</li>
            <li>Insertions: +{}</li>
            <li>Deletions: -{}</li>
            <li>Files added: {}</li>
            <li>Files deleted: {}</li>
            <li>Files modified: {}</li>
        </ul>
    </div>
    
    <div class="diff">
        <h2>Diff</h2>
        <pre>{}</pre>
    </div>
</body>
</html>
        "#, 
            comparison.from_ref,
            comparison.to_ref,
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
            comparison.stats.total_files,
            comparison.stats.total_insertions,
            comparison.stats.total_deletions,
            comparison.stats.files_added,
            comparison.stats.files_deleted,
            comparison.stats.files_modified,
            html_escape::encode_text(&comparison.diff.patch)
        );
        Ok(html)
    }

    fn generate_markdown_report(&self, comparison: &GitComparisonResult) -> Result<String> {
        let markdown = format!(r#"# Git Comparison Report

**From:** `{}`  
**To:** `{}`  
**Generated:** {}

## Summary

- **Files changed:** {}
- **Insertions:** +{}
- **Deletions:** -{}
- **Files added:** {}
- **Files deleted:** {}
- **Files modified:** {}

## Commits Between References

{}

## Diff

```diff
{}
```
        "#,
            comparison.from_ref,
            comparison.to_ref,
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
            comparison.stats.total_files,
            comparison.stats.total_insertions,
            comparison.stats.total_deletions,
            comparison.stats.files_added,
            comparison.stats.files_deleted,
            comparison.stats.files_modified,
            comparison.commits_between.iter()
                .map(|c| format!("- `{}` {} ({})", &c.short_hash, c.message.lines().next().unwrap_or(""), c.author.name))
                .collect::<Vec<_>>()
                .join("\n"),
            comparison.diff.patch
        );
        Ok(markdown)
    }

    fn generate_text_report(&self, comparison: &GitComparisonResult) -> Result<String> {
        let text = format!(r#"Git Comparison Report
====================

From: {}
To: {}
Generated: {}

Summary:
--------
Files changed: {}
Insertions: +{}
Deletions: -{}
Files added: {}
Files deleted: {}
Files modified: {}

Diff:
-----
{}
        "#,
            comparison.from_ref,
            comparison.to_ref,
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
            comparison.stats.total_files,
            comparison.stats.total_insertions,
            comparison.stats.total_deletions,
            comparison.stats.files_added,
            comparison.stats.files_deleted,
            comparison.stats.files_modified,
            comparison.diff.patch
        );
        Ok(text)
    }

    // Métodos auxiliares privados

    fn get_repository(&self, path: &str) -> Result<&Repository> {
        self.repositories
            .get(path)
            .ok_or_else(|| anyhow!("Repositório não aberto: {}", path))
    }

    fn resolve_ref(&self, repo: &Repository, ref_str: &str) -> Result<Oid> {
        // Tentar resolver como hash direto
        if let Ok(oid) = Oid::from_str(ref_str) {
            return Ok(oid);
        }

        // Tentar resolver como referência
        if let Ok(reference) = repo.find_reference(ref_str) {
            if let Some(target) = reference.target() {
                return Ok(target);
            }
        }

        // Tentar resolver como branch
        let branch_ref = format!("refs/heads/{}", ref_str);
        if let Ok(oid) = repo.refname_to_id(&branch_ref) {
            return Ok(oid);
        }

        // Tentar resolver como tag
        let tag_ref = format!("refs/tags/{}", ref_str);
        if let Ok(oid) = repo.refname_to_id(&tag_ref) {
            return Ok(oid);
        }

        // Tentar resolver como remote branch
        let remote_ref = format!("refs/remotes/origin/{}", ref_str);
        if let Ok(oid) = repo.refname_to_id(&remote_ref) {
            return Ok(oid);
        }

        Err(anyhow!("Não foi possível resolver referência: {}", ref_str))
    }

    fn commit_to_git_commit(&self, commit: &Commit) -> Result<GitCommit> {
        let hash = commit.id().to_string();
        let short_hash = format!("{:.7}", commit.id());
        let message = commit.message().unwrap_or("").to_string();
        let author = signature_to_git_author(&commit.author());
        let committer = signature_to_git_author(&commit.committer());
        let date = time_to_datetime(commit.time());
        
        let parent_hashes = commit
            .parent_ids()
            .map(|oid| oid.to_string())
            .collect();
        
        let tree_hash = commit.tree_id().to_string();

        Ok(GitCommit {
            hash,
            short_hash,
            message,
            author,
            committer,
            date,
            parent_hashes,
            tree_hash,
            stats: None, // Pode ser calculado separadamente se necessário
        })
    }

    fn branch_to_git_branch(&self, repo: &Repository, branch: &Branch, is_remote: bool) -> Result<Option<GitBranch>> {
        let name = branch.name()?.unwrap_or("").to_string();
        if name.is_empty() {
            return Ok(None);
        }

        let reference = branch.get();
        let hash = reference.target().unwrap_or(Oid::zero()).to_string();
        
        let is_current = if !is_remote {
            repo.head().ok()
                .and_then(|head| head.shorthand().map(|s| s.to_string()))
                .map(|current| current == name)
                .unwrap_or(false)
        } else {
            false
        };

        let upstream = if !is_remote {
            branch
                .upstream().ok()                             // Option<Upstream>
                .and_then(|u| {
                    // Result<Option<&str>, _>  -> Option<&str>  -> Option<String>
                    u.name()
                    .ok()                                   // Option<Option<&str>>
                    .and_then(|opt| opt.map(|s| s.to_owned())) // Option<String>
                })
        } else {
            None
        };

        let last_commit = if let Ok(oid) = reference.target().ok_or(anyhow!("No target")) {
            if let Ok(commit) = repo.find_commit(oid) {
                Some(self.commit_to_git_commit(&commit)?)
            } else {
                None
            }
        } else {
            None
        };

        Ok(Some(GitBranch {
            name,
            hash,
            is_current,
            is_remote,
            upstream,
            ahead: 0,    // Pode ser calculado comparando com upstream
            behind: 0,   // Pode ser calculado comparando com upstream
            last_commit,
        }))
    }

    fn calculate_repo_size(&self, path: &Path) -> Result<String> {
        let bytes = self.calculate_repo_size_bytes(path)?;
        Ok(format_bytes(bytes))
    }

    fn calculate_repo_size_bytes(&self, path: &Path) -> Result<u64> {
        let mut size = 0;
        
        fn visit_dir(dir: &Path, size: &mut u64) -> Result<()> {
            if dir.is_dir() {
                for entry in std::fs::read_dir(dir)? {
                    let entry = entry?;
                    let path = entry.path();
                    if path.is_dir() {
                        visit_dir(&path, size)?;
                    } else {
                        *size += entry.metadata()?.len();
                    }
                }
            }
            Ok(())
        }

        visit_dir(path, &mut size)?;
        Ok(size)
    }

    fn diff_to_git_diff(&self, diff: &Diff, patch: &str) -> Result<Vec<GitFileDiff>> {
        let mut files = Vec::new();
        
        for delta in diff.deltas() {
            let git_file_diff = self.delta_to_git_file_diff_simple(&delta)?;
            files.push(git_file_diff);
        }

        Ok(files)
    }

    fn delta_to_git_file_diff(&self, repo: &Repository, delta: &git2::DiffDelta, diff: &Diff) -> Result<GitFileDiff> {
        let old_path = delta.old_file().path().map(|p| p.to_string_lossy().to_string());
        let new_path = delta.new_file().path().map(|p| p.to_string_lossy().to_string());
        
        let status = match delta.status() {
            git2::Delta::Added => GitFileStatus::Added,
            git2::Delta::Deleted => GitFileStatus::Deleted,
            git2::Delta::Modified => GitFileStatus::Modified,
            git2::Delta::Renamed => GitFileStatus::Renamed,
            git2::Delta::Copied => GitFileStatus::Copied,
            _ => GitFileStatus::Modified,
        };

        let similarity = if delta.status() == git2::Delta::Renamed || delta.status() == git2::Delta::Copied {
            None // similarity não está disponível na versão atual do git2
        } else {
            None
        };

        let binary = false; // is_binary não está disponível na versão atual do git2
        
        let old_mode = Some(format!("{:o}", delta.old_file().mode() as u32));
        let new_mode = Some(format!("{:o}", delta.new_file().mode() as u32));
        let old_hash = Some(delta.old_file().id().to_string());
        let new_hash = Some(delta.new_file().id().to_string());

        // Extrai hunks e linhas do diff usando print callback
        let mut hunks: Vec<GitDiffHunk> = Vec::new();
        let mut patch_content = String::new();
        
        diff.print(DiffFormat::Patch, |_delta, hunk, line| {
            if let Some(h) = hunk {
                // Novo hunk
                if let Some(last_hunk) = hunks.last_mut() {
                    // Não faz nada, o hunk atual já foi adicionado
                } else {
                    // Primeiro hunk
                }
                
                // Verificar se já existe um hunk com este header
                let header = String::from_utf8_lossy(h.header()).to_string();
                if hunks.iter().find(|existing_hunk| existing_hunk.header == header).is_none() {
                    hunks.push(GitDiffHunk {
                        header: header.clone(),
                        old_start: h.old_start() as u32,
                        old_lines: h.old_lines() as u32,
                        new_start: h.new_start() as u32,
                        new_lines: h.new_lines() as u32,
                        lines: Vec::new(),
                        context: None,
                    });
                }
            }
            
            if let Some(current_hunk) = hunks.last_mut() {
                let line_type = match line.origin() {
                    '+' => GitDiffLineType::Added,
                    '-' => GitDiffLineType::Deleted,
                    ' ' => GitDiffLineType::Context,
                    _ => GitDiffLineType::Context,
                };
                
                current_hunk.lines.push(GitDiffLine {
                    content: String::from_utf8_lossy(line.content()).to_string(),
                    line_type,
                    old_line_number: line.old_lineno().map(|n| n as u32),
                    new_line_number: line.new_lineno().map(|n| n as u32),
                });
            }
            
            patch_content.push_str(&String::from_utf8_lossy(line.content()));
            true
        })?;

        Ok(GitFileDiff {
            old_path,
            new_path,
            status,
            similarity,
            binary,
            hunks,
            old_mode,
            new_mode,
            old_hash,
            new_hash,
        })
    }

    fn delta_to_git_file_diff_simple(&self, delta: &git2::DiffDelta) -> Result<GitFileDiff> {
        let old_path = delta.old_file().path().map(|p| p.to_string_lossy().to_string());
        let new_path = delta.new_file().path().map(|p| p.to_string_lossy().to_string());
        
        let status = match delta.status() {
            git2::Delta::Added => GitFileStatus::Added,
            git2::Delta::Deleted => GitFileStatus::Deleted,
            git2::Delta::Modified => GitFileStatus::Modified,
            git2::Delta::Renamed => GitFileStatus::Renamed,
            git2::Delta::Copied => GitFileStatus::Copied,
            _ => GitFileStatus::Modified,
        };

        Ok(GitFileDiff {
            old_path,
            new_path,
            status,
            similarity: None,
            binary: false, // is_binary não está disponível na versão atual do git2
            hunks: Vec::new(),
            old_mode: None,
            new_mode: None,
            old_hash: None,
            new_hash: None,
        })
    }

    fn get_commits_between(&self, repo: &Repository, from_oid: Oid, to_oid: Oid) -> Result<Vec<GitCommit>> {
        let mut revwalk = repo.revwalk()?;
        revwalk.push(to_oid)?;
        revwalk.hide(from_oid)?;
        
        let commits: Result<Vec<GitCommit>> = revwalk
            .take(50) // Limitar para performance
            .map(|oid| {
                let oid = oid?;
                let commit = repo.find_commit(oid)?;
                self.commit_to_git_commit(&commit)
            })
            .collect();

        commits
    }

    fn get_file_content_from_tree(&self, repo: &Repository, tree: &Tree, file_path: &str) -> Result<String> {
        let entry = tree.get_path(Path::new(file_path))?;
        let object = entry.to_object(repo)?;
        
        if let Some(blob) = object.as_blob() {
            let content = blob.content();
            Ok(String::from_utf8_lossy(content).to_string())
        } else {
            Err(anyhow!("Arquivo não é um blob: {}", file_path))
        }
    }

    fn detect_language(&self, file_path: &str) -> String {
        let extension = Path::new(file_path)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");

        match extension.to_lowercase().as_str() {
            "js" | "jsx" => "javascript",
            "ts" | "tsx" => "typescript",
            "py" => "python",
            "rs" => "rust",
            "go" => "go",
            "java" => "java",
            "c" => "c",
            "cpp" | "cxx" | "cc" => "cpp",
            "h" | "hpp" => "c",
            "cs" => "csharp",
            "php" => "php",
            "rb" => "ruby",
            "swift" => "swift",
            "kt" => "kotlin",
            "scala" => "scala",
            "sh" | "bash" | "zsh" => "shell",
            "ps1" => "powershell",
            "html" | "htm" => "html",
            "xml" => "xml",
            "css" => "css",
            "scss" => "scss",
            "sass" => "sass",
            "less" => "less",
            "json" => "json",
            "yaml" | "yml" => "yaml",
            "toml" => "toml",
            "ini" | "cfg" | "conf" => "ini",
            "md" | "markdown" => "markdown",
            "tex" => "latex",
            "sql" => "sql",
            _ => "plaintext",
        }.to_string()
    }

    fn is_binary_file(&self, file_path: &str) -> bool {
        let extension = Path::new(file_path)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        matches!(extension.as_str(), 
            "png" | "jpg" | "jpeg" | "gif" | "bmp" | "ico" | "svg" |
            "mp3" | "mp4" | "avi" | "mov" | "wav" | "ogg" |
            "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" |
            "zip" | "tar" | "gz" | "rar" | "7z" |
            "exe" | "dll" | "so" | "dylib" | "bin"
        )
    }

    fn commit_contains_pickaxe(&self, repo: &Repository, commit: &Commit, query: &str) -> Result<bool> {
        if commit.parent_count() == 0 {
            return Ok(false);
        }

        let parent = commit.parent(0)?;
        let commit_tree = commit.tree()?;
        let parent_tree = parent.tree()?;

        let mut diff_options = DiffOptions::new();
        let diff = repo.diff_tree_to_tree(Some(&parent_tree), Some(&commit_tree), Some(&mut diff_options))?;

        let mut found = false;
        diff.print(DiffFormat::Patch, |_delta, _hunk, line| {
            if let Ok(content) = std::str::from_utf8(line.content()) {
                if content.contains(query) {
                    found = true;
                }
            }
            true
        })?;

        Ok(found)
    }

    fn grep_tree(&self, repo: &Repository, tree: &Tree, query: &str, file_pattern: Option<String>, results: &mut Vec<GitSearchMatch>, max_results: u32) -> Result<()> {
        let regex = Regex::new(&format!("(?i){}", regex::escape(query)))?;
        let file_regex = file_pattern.as_ref()
            .map(|pattern| Regex::new(pattern))
            .transpose()?;

        self.walk_tree(repo, tree, "", &mut |path, content| {
            if results.len() >= max_results as usize {
                return Ok(false); // Stop walking
            }

            // Filtrar por padrão de arquivo se especificado
            if let Some(ref file_regex) = file_regex {
                if !file_regex.is_match(path) {
                    return Ok(true); // Continue walking
                }
            }

            // Buscar pela query no conteúdo
            for (line_number, line) in content.lines().enumerate() {
                if regex.is_match(line) {
                    // Criar um commit dummy para o resultado (idealmente seria o commit atual)
                    if let Ok(head) = repo.head() {
                        if let Ok(commit) = repo.find_commit(head.target().unwrap()) {
                            results.push(GitSearchMatch {
                                commit: self.commit_to_git_commit(&commit).unwrap_or_else(|_| {
                                    // Commit dummy em caso de erro
                                    GitCommit {
                                        hash: "0".repeat(40),
                                        short_hash: "0000000".to_string(),
                                        message: "".to_string(),
                                        author: GitAuthor {
                                            name: "Unknown".to_string(),
                                            email: "unknown@example.com".to_string(),
                                            date: Utc::now(),
                                        },
                                        committer: GitAuthor {
                                            name: "Unknown".to_string(),
                                            email: "unknown@example.com".to_string(),
                                            date: Utc::now(),
                                        },
                                        date: Utc::now(),
                                        parent_hashes: Vec::new(),
                                        tree_hash: "0".repeat(40),
                                        stats: None,
                                    }
                                }),
                                file_path: Some(path.to_string()),
                                line_number: Some((line_number + 1) as u32),
                                content: Some(line.to_string()),
                                context_before: None,
                                context_after: None,
                            });
                        }
                    }
                }
            }

            Ok(true) // Continue walking
        })?;

        Ok(())
    }

    fn walk_tree<F>(&self, repo: &Repository, tree: &Tree, prefix: &str, callback: &mut F) -> Result<()>
    where
        F: FnMut(&str, &str) -> Result<bool>,
    {
        for entry in tree {
            let name = entry.name().unwrap_or("");
            let path = if prefix.is_empty() {
                name.to_string()
            } else {
                format!("{}/{}", prefix, name)
            };

            match entry.kind() {
                Some(ObjectType::Tree) => {
                    if let Ok(subtree) = entry.to_object(repo)?.peel_to_tree() {
                        self.walk_tree(repo, &subtree, &path, callback)?;
                    }
                }
                Some(ObjectType::Blob) => {
                    if let Ok(blob) = entry.to_object(repo)?.peel_to_blob() {
                        let content = String::from_utf8_lossy(blob.content());
                        if !callback(&path, &content)? {
                            break;
                        }
                    }
                }
                _ => {}
            }
        }
        Ok(())
    }

    fn count_tree_entries(&self, repo: &Repository, tree: &Tree) -> Result<u32> {
        let mut count = 0;
        
        for entry in tree {
            match entry.kind() {
                Some(ObjectType::Tree) => {
                    if let Ok(subtree) = entry.to_object(repo)?.peel_to_tree() {
                        count += self.count_tree_entries(repo, &subtree)?;
                    }
                }
                Some(ObjectType::Blob) => {
                    count += 1;
                }
                _ => {}
            }
        }
        
        Ok(count)
    }
}

// Funções auxiliares
fn signature_to_git_author(sig: &Signature) -> GitAuthor {
    GitAuthor {
        name: sig.name().unwrap_or("").to_string(),
        email: sig.email().unwrap_or("").to_string(),
        date: time_to_datetime(sig.when()),
    }
}

fn time_to_datetime(time: Time) -> DateTime<Utc> {
    Utc.timestamp_opt(time.seconds(), 0).single().unwrap_or_else(Utc::now)
}

fn format_bytes(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    if unit_index == 0 {
        format!("{} {}", bytes, UNITS[unit_index])
    } else {
        format!("{:.1} {}", size, UNITS[unit_index])
    }
}
