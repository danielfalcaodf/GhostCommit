use tauri::State;
use std::sync::Mutex;
use crate::models::*;
use crate::git::GitManager;

type GitManagerState<'a> = State<'a, Mutex<GitManager>>;

#[tauri::command]
pub async fn git_open_repository(
    git_manager: GitManagerState<'_>,
    params: OpenRepositoryParams,
) -> Result<TauriResponse<GitRepository>, String> {
    let mut manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.open_repository(&params.path) {
        Ok(repo) => Ok(TauriResponse::success(repo)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_list_references(
    git_manager: GitManagerState<'_>,
    params: ListReferencesParams,
) -> Result<TauriResponse<Vec<GitReference>>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.list_references(&params.repo_path) {
        Ok(refs) => Ok(TauriResponse::success(refs)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_compare_commits(
    git_manager: GitManagerState<'_>,
    params: CompareCommitsParams,
) -> Result<TauriResponse<GitCompareResult>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.compare_commits(&params.path, &params.from_ref, &params.to_ref) {
        Ok(result) => Ok(TauriResponse::success(result)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_get_file_diff(
    git_manager: GitManagerState<'_>,
    params: GetFileDiffParams,
) -> Result<TauriResponse<GitFileDiff>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.get_file_diff(&params.repo_path, &params.commit1, &params.commit2, &params.file_path) {
        Ok(diff) => Ok(TauriResponse::success(diff)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_get_file_blame(
    git_manager: GitManagerState<'_>,
    params: GetFileBlameParams,
) -> Result<TauriResponse<GitBlameInfo>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.get_file_blame(&params.path, &params.file_path, params.commit_hash) {
        Ok(blame) => Ok(TauriResponse::success(blame)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_search_code(
    git_manager: GitManagerState<'_>,
    params: SearchCodeParams,
) -> Result<TauriResponse<GitSearchResult>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.search_code(
        &params.repo_path,
        &params.query,
        params.commit_hash,
        params.max_results,
        params.context_lines,
    ) {
        Ok(result) => Ok(TauriResponse::success(result)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_get_commit_stats(
    git_manager: GitManagerState<'_>,
    params: GetCommitStatsParams,
) -> Result<TauriResponse<GitCommitStats>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.get_commit_stats(&params.repo_path, &params.commit_hash) {
        Ok(stats) => Ok(TauriResponse::success(stats)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_get_branch_info(
    git_manager: GitManagerState<'_>,
    params: GetBranchInfoParams,
) -> Result<TauriResponse<GitBranchInfo>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.get_branch_info(&params.repo_path) {
        Ok(info) => Ok(TauriResponse::success(info)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn export_comparison_report(
    git_manager: GitManagerState<'_>,
    params: ExportReportParams,
) -> Result<TauriResponse<String>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.export_comparison_report(&params) {
        Ok(path) => Ok(TauriResponse::success(path)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn open_folder_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use std::sync::{Arc, Mutex};
    use std::sync::mpsc;
    use tauri_plugin_dialog::DialogExt;
    
    let (tx, rx) = mpsc::channel();
    let tx = Arc::new(Mutex::new(Some(tx)));
    
    app.dialog()
        .file()
        .set_title("Selecionar Repositório Git")
        .pick_folder(move |result| {
            if let Some(tx) = tx.lock().unwrap().take() {
                let _ = tx.send(result.map(|path| path.to_string()));
            }
        });
    
    match rx.recv() {
        Ok(result) => Ok(result),
        Err(_) => Ok(None),
    }
}

#[tauri::command]
pub async fn save_file_dialog(
    app: tauri::AppHandle,
    filename: String,
    content: String,
) -> Result<bool, String> {
    use std::sync::{Arc, Mutex};
    use std::sync::mpsc;
    use tauri_plugin_dialog::DialogExt;
    use std::fs;
    
    let (tx, rx) = mpsc::channel();
    let tx = Arc::new(Mutex::new(Some(tx)));
    
    app.dialog()
        .file()
        .set_title("Salvar Arquivo")
        .set_file_name(&filename)
        .save_file(move |result| {
            if let Some(tx) = tx.lock().unwrap().take() {
                let _ = tx.send(result);
            }
        });
    
    match rx.recv() {
        Ok(Some(path)) => {
            let path_buf = std::path::PathBuf::from(path.to_string());
            fs::write(&path_buf, content)
                .map_err(|e| e.to_string())
                .map(|_| true)
        }
        Ok(None) => Ok(false),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn git_get_commits(
    git_manager: GitManagerState<'_>,
    params: GetCommitsParams,
) -> Result<TauriResponse<Vec<GitCommit>>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.get_commits(&params.path, params.limit, params.offset, params.branch) {
        Ok(commits) => Ok(TauriResponse::success(commits)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_get_branches(
    git_manager: GitManagerState<'_>,
    params: GetBranchesParams,
) -> Result<TauriResponse<Vec<GitBranch>>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.get_branches(&params.path) {
        Ok(branches) => Ok(TauriResponse::success(branches)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_get_tags(
    git_manager: GitManagerState<'_>,
    params: GetTagsParams,
) -> Result<TauriResponse<Vec<GitTag>>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.get_tags(&params.path) {
        Ok(tags) => Ok(TauriResponse::success(tags)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_get_file_comparison(
    git_manager: GitManagerState<'_>,
    params: GetFileComparisonParams,
) -> Result<TauriResponse<GitFileComparison>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.get_file_comparison(&params.path, &params.from_ref, &params.to_ref, &params.file_path) {
        Ok(comparison) => Ok(TauriResponse::success(comparison)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_get_file_content(
    git_manager: GitManagerState<'_>,
    params: GetFileContentParams,
) -> Result<TauriResponse<String>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.get_file_content(&params.path, &params.file_path, &params.commit_hash) {
        Ok(content) => Ok(TauriResponse::success(content)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_is_valid_repository(
    git_manager: GitManagerState<'_>,
    params: IsValidRepositoryParams,
) -> Result<TauriResponse<bool>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.is_valid_repository(&params.path) {
        Ok(is_valid) => Ok(TauriResponse::success(is_valid)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}

#[tauri::command]
pub async fn git_get_repository_stats(
    git_manager: GitManagerState<'_>,
    params: GetRepositoryStatsParams,
) -> Result<TauriResponse<GitRepositoryStats>, String> {
    let manager = git_manager.lock().map_err(|e| e.to_string())?;
    
    match manager.get_repository_stats(&params.path) {
        Ok(stats) => Ok(TauriResponse::success(stats)),
        Err(e) => Ok(TauriResponse::error(e.to_string())),
    }
}
