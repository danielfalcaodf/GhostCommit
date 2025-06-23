use std::sync::Mutex;

mod models;
mod git;
mod commands;

use git::GitManager;
use commands::*;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Inicializar o gerenciador Git
    let git_manager = Mutex::new(GitManager::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(git_manager)
        .invoke_handler(tauri::generate_handler![
            greet,
            // Comandos Git disponíveis
            git_open_repository,
            git_list_references,
            git_compare_commits,
            git_get_commits,
            git_get_branches,
            git_get_tags,
            git_get_file_comparison,
            git_get_file_content,
            git_is_valid_repository,
            git_get_repository_stats,
            git_get_file_diff,
            git_get_file_blame,
            git_search_code,
            git_get_commit_stats,
            git_get_branch_info,
            export_comparison_report,
            // Comandos do sistema
            open_folder_dialog,
            save_file_dialog,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
