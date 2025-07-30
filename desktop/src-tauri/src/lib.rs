use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use tauri::Emitter;

#[derive(Debug, Serialize, Deserialize)]
struct DownloadProgress {
    game_id: String,
    downloaded: u64,
    total: u64,
    percentage: f32,
    speed: f64,
    eta: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct GameInstallResult {
    success: bool,
    install_path: Option<String>,
    executable: Option<String>,
    error: Option<String>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn get_games_directory() -> Result<PathBuf, String> {
    let base_dir = dirs::data_local_dir()
        .ok_or_else(|| "Failed to get local data directory".to_string())?;

    let games_dir = base_dir.join("VAPR").join("Games");

    fs::create_dir_all(&games_dir)
        .map_err(|e| format!("Failed to create games directory: {}", e))?;

    Ok(games_dir)
}

#[tauri::command]
async fn download_and_install_game(
    window: tauri::Window,
    game_id: String,
    game_name: String,
    download_url: String,
) -> Result<GameInstallResult, String> {
    let start_time = std::time::Instant::now();

    let vapr_games_dir = get_games_directory()?;
    let safe_game_name = game_name.replace(" ", "_").replace(":", "");
    let game_dir = vapr_games_dir.join(&safe_game_name);

    fs::create_dir_all(&game_dir).map_err(|e| format!("Failed to create directory: {}", e))?;

    let client = reqwest::Client::new();
    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("Failed to start download: {}", e))?;

    let total_size = response
        .content_length()
        .ok_or("Failed to get content length")?;

    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    let mut file_data = Vec::new();

    use futures_util::StreamExt;
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Download error: {}", e))?;
        file_data.extend_from_slice(&chunk);
        downloaded += chunk.len() as u64;

        let elapsed = start_time.elapsed().as_secs_f64();
        let speed = if elapsed > 0.0 {
            downloaded as f64 / elapsed / 1024.0 / 1024.0
        } else {
            0.0
        };

        let eta = if speed > 0.0 {
            ((total_size - downloaded) as f64 / (speed * 1024.0 * 1024.0)) as u64
        } else {
            0
        };

        let progress = DownloadProgress {
            game_id: game_id.clone(),
            downloaded,
            total: total_size,
            percentage: (downloaded as f32 / total_size as f32) * 100.0,
            speed,
            eta,
        };

        window
            .emit("download-progress", &progress)
            .map_err(|e| format!("Failed to emit progress: {}", e))?;
    }

    window
        .emit("download-status", serde_json::json!({
            "game_id": game_id.clone(),
            "status": "Extracting game files..."
        }))
        .map_err(|e| format!("Failed to emit status: {}", e))?;

    let cursor = Cursor::new(file_data);
    let mut archive = zip::ZipArchive::new(cursor)
        .map_err(|e| format!("Failed to read zip archive: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read file from archive: {}", e))?;

        let outpath = match file.enclosed_name() {
            Some(path) => game_dir.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)
                        .map_err(|e| format!("Failed to create parent directory: {}", e))?;
                }
            }

            let mut outfile = fs::File::create(&outpath)
                .map_err(|e| format!("Failed to create file: {}", e))?;

            std::io::copy(&mut file, &mut outfile)
                .map_err(|e| format!("Failed to write file: {}", e))?;
        }

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Some(mode) = file.unix_mode() {
                fs::set_permissions(&outpath, fs::Permissions::from_mode(mode))
                    .map_err(|e| format!("Failed to set permissions: {}", e))?;
            }
        }
    }

    let executable = find_game_executable(&game_dir)?;

    let game_info = serde_json::json!({
        "id": game_id,
        "name": game_name,
        "install_path": game_dir.to_string_lossy(),
        "executable": executable.to_string_lossy(),
        "installed_at": chrono::Utc::now().to_rfc3339(),
    });

    let game_info_path = game_dir.join("vapr_game_info.json");
    fs::write(
        &game_info_path,
        serde_json::to_string_pretty(&game_info).unwrap(),
    )
    .map_err(|e| format!("Failed to save game info: {}", e))?;

    Ok(GameInstallResult {
        success: true,
        install_path: Some(game_dir.to_string_lossy().to_string()),
        executable: Some(executable.to_string_lossy().to_string()),
        error: None,
    })
}

fn find_game_executable(game_dir: &Path) -> Result<PathBuf, String> {
    let entries = fs::read_dir(game_dir)
        .map_err(|e| format!("Failed to read game directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "exe" {
                    return Ok(path);
                }
            }
        }
    }

    find_exe_recursive(game_dir, 0, 2)
        .ok_or_else(|| "No executable found in game directory".to_string())
}

fn find_exe_recursive(dir: &Path, current_depth: u32, max_depth: u32) -> Option<PathBuf> {
    if current_depth > max_depth {
        return None;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "exe" {
                        return Some(path);
                    }
                }
            } else if path.is_dir() {
                if let Some(exe) = find_exe_recursive(&path, current_depth + 1, max_depth) {
                    return Some(exe);
                }
            }
        }
    }

    None
}

#[tauri::command]
async fn launch_game(executable_path: String) -> Result<bool, String> {
    use std::process::Command;

    let path = PathBuf::from(&executable_path);

    if !path.exists() {
        return Err("Executable not found".to_string());
    }

    let exe_dir = path.parent()
        .ok_or_else(|| "Failed to get executable directory".to_string())?;

    #[cfg(target_os = "windows")]
    {
        Command::new(&executable_path)
            .current_dir(exe_dir)
            .spawn()
            .map_err(|e| format!("Failed to launch game: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        Command::new(&executable_path)
            .current_dir(exe_dir)
            .spawn()
            .map_err(|e| format!("Failed to launch game: {}", e))?;
    }

    Ok(true)
}

#[tauri::command]
async fn get_installed_games() -> Result<Vec<serde_json::Value>, String> {
    let vapr_games_dir = get_games_directory()?;

    if !vapr_games_dir.exists() {
        return Ok(vec![]);
    }

    let mut games = Vec::new();

    if let Ok(entries) = fs::read_dir(&vapr_games_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let info_file = path.join("vapr_game_info.json");
                if info_file.exists() {
                    if let Ok(content) = fs::read_to_string(&info_file) {
                        if let Ok(game_info) = serde_json::from_str::<serde_json::Value>(&content) {
                            games.push(game_info);
                        }
                    }
                }
            }
        }
    }

    Ok(games)
}

#[tauri::command]
async fn uninstall_game(game_id: String) -> Result<bool, String> {
    let vapr_games_dir = get_games_directory()?;

    if let Ok(entries) = fs::read_dir(&vapr_games_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let info_file = path.join("vapr_game_info.json");
                if info_file.exists() {
                    if let Ok(content) = fs::read_to_string(&info_file) {
                        if let Ok(game_info) = serde_json::from_str::<serde_json::Value>(&content) {
                            if game_info.get("id").and_then(|v| v.as_str()) == Some(&game_id) {
                                fs::remove_dir_all(&path)
                                    .map_err(|e| format!("Failed to remove game directory: {}", e))?;
                                return Ok(true);
                            }
                        }
                    }
                }
            }
        }
    }

    Err("Game not found".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            download_and_install_game,
            launch_game,
            get_installed_games,
            uninstall_game
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}