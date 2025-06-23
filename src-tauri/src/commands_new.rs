use tauri::{State, Manager};
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
    
    match manager.compare_commits(&params.repo_path, &params.commit1, &params.commit2) {
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
    
    match manager.get_file_blame(&params.repo_path, &params.file_path, params.commit_hash) {
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
pub async fn open_folder_dialog() -> Result<Option<String>, String> {
    use tauri::api::dialog;
    
    Ok(dialog::blocking::FileDialogBuilder::new()
        .set_title("Selecionar Repositório Git")
        .pick_folder()
        .map(|path| path.to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn save_file_dialog(
    filename: String,
    content: String,
) -> Result<bool, String> {
    use tauri::api::dialog;
    use std::fs;
    
    if let Some(path) = dialog::blocking::FileDialogBuilder::new()
        .set_title("Salvar Arquivo")
        .set_file_name(&filename)
        .save_file()
    {
        fs::write(path, content)
            .map_err(|e| e.to_string())
            .map(|_| true)
    } else {
        Ok(false)
    }
}
