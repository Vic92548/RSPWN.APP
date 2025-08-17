mod websocket;

use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};

use std::fs;
use std::io::{Cursor, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::AppHandle;
use tauri::{Emitter, Manager, State};
use semver::Version;
use websocket::{UserInfo, WebSocketServer};
use tokio::sync::{oneshot, Mutex, RwLock};
use uuid::Uuid;
use tokio::time::{timeout, Duration};

// Bridge that lets Rust request data via the JS client and await the response
pub struct SdkBridge {
    app: AppHandle,
    pending: Arc<Mutex<HashMap<String, oneshot::Sender<Result<JsonValue, String>>>>>,
}

impl SdkBridge {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app,
            pending: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn request(&self, name: &str, payload: JsonValue) -> Result<JsonValue, String> {
        let id = Uuid::new_v4().to_string();
        let (tx, rx) = oneshot::channel();
        {
            let mut pending = self.pending.lock().await;
            pending.insert(id.clone(), tx);
        }

        // Emit to all windows; frontend JS should handle 'sdk-request' and call sdk_response
        self.app
            .emit(
                "sdk-request",
                serde_json::json!({
                    "id": id,
                    "name": name,
                    "payload": payload
                }),
            )
            .map_err(|e| format!("Failed to emit sdk-request: {}", e))?;

        // Wait for response with timeout
        match timeout(Duration::from_secs(20), rx).await {
            Ok(Ok(Ok(val))) => Ok(val),
            Ok(Ok(Err(err))) => Err(err),
            Ok(Err(_canceled)) => Err("Response channel canceled".to_string()),
            Err(_t) => Err("Timed out waiting for JS SDK response".to_string()),
        }
    }

    pub async fn resolve_response(
        &self,
        id: String,
        result: Result<JsonValue, String>,
    ) -> Result<(), String> {
        let sender_opt = { self.pending.lock().await.remove(&id) };
        if let Some(sender) = sender_opt {
            let _ = sender.send(result);
            Ok(())
        } else {
            Err("No pending request for given id".to_string())
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct DownloadProgress {
    download_id: String,
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

#[derive(Debug, Serialize, Deserialize)]
struct VersionCheckResult {
    is_compatible: bool,
    current_version: String,
    required_version: String,
    download_url: String,
}

#[derive(Debug, Clone)]
struct DownloadState {
    id: String,
    game_id: String,
    game_name: String,
    download_url: String,
    is_paused: Arc<AtomicBool>,
    downloaded_bytes: Arc<Mutex<u64>>,
    total_bytes: Arc<Mutex<u64>>,
    start_time: Arc<Mutex<Option<std::time::Instant>>>,
}

struct AppState {
    downloads: Arc<Mutex<HashMap<String, DownloadState>>>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn check_version_compatibility() -> Result<VersionCheckResult, String> {
    let current_version = env!("CARGO_PKG_VERSION");

    let response = reqwest::get("https://vapr.club/api/desktop-version")
        .await
        .map_err(|e| format!("Failed to check version: {}", e))?;

    let version_info: serde_json::Value = response.json()
        .await
        .map_err(|e| format!("Failed to parse version info: {}", e))?;

    let required_version = version_info["minimum_version"]
        .as_str()
        .ok_or("Invalid version format")?;

    let current = Version::parse(current_version)
        .map_err(|e| format!("Failed to parse current version: {}", e))?;
    let required = Version::parse(required_version)
        .map_err(|e| format!("Failed to parse required version: {}", e))?;

    let is_compatible = current >= required;

    let download_url = format!(
        "https://github.com/Vic92548/VAPR/releases/download/v{}/VAPR_{}_x64_en-US.msi",
        required_version,
        required_version
    );

    Ok(VersionCheckResult {
        is_compatible,
        current_version: current_version.to_string(),
        required_version: required_version.to_string(),
        download_url,
    })
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
            download_id: format!("legacy-{}", game_id),
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
            "download_id": format!("legacy-{}", game_id),
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

#[tauri::command]
async fn start_download(
    window: tauri::Window,
    state: State<'_, AppState>,
    download_id: String,
    game_id: String,
    game_name: String,
    download_url: String,
) -> Result<GameInstallResult, String> {
    let download_state = DownloadState {
        id: download_id.clone(),
        game_id: game_id.clone(),
        game_name: game_name.clone(),
        download_url: download_url.clone(),
        is_paused: Arc::new(AtomicBool::new(false)),
        downloaded_bytes: Arc::new(Mutex::new(0)),
        total_bytes: Arc::new(Mutex::new(0)),
        start_time: Arc::new(Mutex::new(Some(std::time::Instant::now()))),
    };

    // Store download state
    {
        let mut downloads = state.downloads.lock().await;
        downloads.insert(download_id.clone(), download_state.clone());
    }

    // Spawn download task
    tauri::async_runtime::spawn(async move {
        perform_download(window, download_state).await;
    });

    Ok(GameInstallResult {
        success: true,
        install_path: None,
        executable: None,
        error: None,
    })
}

async fn perform_download(window: tauri::Window, download_state: DownloadState) {
    let result = download_with_resume_support(window.clone(), download_state.clone()).await;

    match result {
        Ok((install_path, executable)) => {
            window.emit("download-complete", serde_json::json!({
                "download_id": download_state.id,
                "install_path": install_path,
                "executable": executable
            })).unwrap();
        }
        Err(e) => {
            window.emit("download-error", serde_json::json!({
                "download_id": download_state.id,
                "error": e.to_string()
            })).unwrap();
        }
    }
}

async fn download_with_resume_support(
    window: tauri::Window,
    download_state: DownloadState,
) -> Result<(String, String), Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();

    // Get already downloaded bytes if resuming
    let start_byte = *download_state.downloaded_bytes.lock().await;

    let mut request = client.get(&download_state.download_url);
    if start_byte > 0 {
        request = request.header("Range", format!("bytes={}-", start_byte));
    }

    let response = request.send().await?;
    let total_size = response.content_length().unwrap_or(0) + start_byte;

    *download_state.total_bytes.lock().await = total_size;

    let vapr_games_dir = get_games_directory()?;
    let safe_game_name = download_state.game_name.replace(" ", "_").replace(":", "");
    let game_dir = vapr_games_dir.join(&safe_game_name);
    fs::create_dir_all(&game_dir)?;

    let temp_file_path = game_dir.join(format!("{}.download", safe_game_name));
    let mut file = if start_byte > 0 {
        fs::OpenOptions::new()
            .write(true)
            .append(true)
            .open(&temp_file_path)?
    } else {
        fs::File::create(&temp_file_path)?
    };

    let mut stream = response.bytes_stream();
    let mut downloaded = start_byte;
    let mut file_data = Vec::new();

    use futures_util::StreamExt;
    while let Some(chunk) = stream.next().await {
        // Check if paused
        if download_state.is_paused.load(Ordering::Relaxed) {
            return Err("Download paused".into());
        }

        let chunk = chunk?;
        file.write_all(&chunk)?;
        file_data.extend_from_slice(&chunk);
        downloaded += chunk.len() as u64;

        *download_state.downloaded_bytes.lock().await = downloaded;

        // Calculate speed and ETA
        let elapsed = download_state.start_time.lock().await
            .as_ref()
            .map(|t| t.elapsed().as_secs_f64())
            .unwrap_or(1.0);

        let speed = if elapsed > 0.0 {
            (downloaded - start_byte) as f64 / elapsed
        } else {
            0.0
        };

        let eta = if speed > 0.0 {
            ((total_size - downloaded) as f64 / speed) as u64
        } else {
            0
        };

        let progress = DownloadProgress {
            download_id: download_state.id.clone(),
            game_id: download_state.game_id.clone(),
            downloaded,
            total: total_size,
            percentage: (downloaded as f32 / total_size as f32) * 100.0,
            speed: speed / 1024.0 / 1024.0, // Convert to MB/s
            eta,
        };

        window.emit("download-progress", &progress)?;
    }

    // Drop the file handle to close it
    drop(file);

    // Now we need to extract the file
    window.emit("download-status", serde_json::json!({
        "download_id": download_state.id.clone(),
        "status": "Extracting game files...",
        "message": "Extracting game files..."
    }))?;

    // Read the complete file for extraction
    let complete_data = fs::read(&temp_file_path)?;
    let cursor = Cursor::new(complete_data);
    let mut archive = zip::ZipArchive::new(cursor)?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;

        let outpath = match file.enclosed_name() {
            Some(path) => game_dir.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            fs::create_dir_all(&outpath)?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)?;
                }
            }

            let mut outfile = fs::File::create(&outpath)?;
            std::io::copy(&mut file, &mut outfile)?;
        }

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Some(mode) = file.unix_mode() {
                fs::set_permissions(&outpath, fs::Permissions::from_mode(mode))?;
            }
        }
    }

    // Clean up temp file
    let _ = fs::remove_file(&temp_file_path);

    // Find executable
    let executable = find_game_executable(&game_dir)?;

    // Save game info
    let game_info = serde_json::json!({
        "id": download_state.game_id,
        "name": download_state.game_name,
        "install_path": game_dir.to_string_lossy(),
        "executable": executable.to_string_lossy(),
        "installed_at": chrono::Utc::now().to_rfc3339(),
    });

    let game_info_path = game_dir.join("vapr_game_info.json");
    fs::write(
        &game_info_path,
        serde_json::to_string_pretty(&game_info).unwrap(),
    )?;

    Ok((game_dir.to_string_lossy().to_string(), executable.to_string_lossy().to_string()))
}

#[tauri::command]
async fn pause_download(
    state: State<'_, AppState>,
    download_id: String,
) -> Result<(), String> {
    let downloads = state.downloads.lock().await;
    if let Some(download) = downloads.get(&download_id) {
        download.is_paused.store(true, Ordering::Relaxed);
        Ok(())
    } else {
        Err("Download not found".to_string())
    }
}

#[tauri::command]
async fn resume_download(
    window: tauri::Window,
    state: State<'_, AppState>,
    download_id: String,
) -> Result<(), String> {
    let download_state = {
        let downloads = state.downloads.lock().await;
        downloads.get(&download_id).cloned()
    };

    if let Some(download) = download_state {
        download.is_paused.store(false, Ordering::Relaxed);
        *download.start_time.lock().await = Some(std::time::Instant::now());

        // Restart download from where it left off
        tauri::async_runtime::spawn(async move {
            perform_download(window, download).await;
        });

        Ok(())
    } else {
        Err("Download not found".to_string())
    }
}

#[tauri::command]
async fn cancel_download(
    state: State<'_, AppState>,
    download_id: String,
) -> Result<(), String> {
    let mut downloads = state.downloads.lock().await;
    if let Some(download) = downloads.remove(&download_id) {
        download.is_paused.store(true, Ordering::Relaxed);

        // Clean up temporary files
        let safe_game_name = download.game_name.replace(" ", "_").replace(":", "");
        let vapr_games_dir = get_games_directory()?;
        let temp_file = vapr_games_dir.join(&safe_game_name).join(format!("{}.download", safe_game_name));

        if temp_file.exists() {
            let _ = fs::remove_file(temp_file);
        }

        Ok(())
    } else {
        Err("Download not found".to_string())
    }
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

fn resolve_game_id_from_exe_dir(exe_dir: &Path) -> Option<String> {
    // Search up to 3 parent levels for vapr_game_info.json and read the game id
    let mut current: Option<&Path> = Some(exe_dir);
    for _ in 0..4 {
        if let Some(dir) = current {
            let info_path = dir.join("vapr_game_info.json");
            if info_path.exists() {
                if let Ok(content) = fs::read_to_string(&info_path) {
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                        if let Some(id) = json.get("id").and_then(|v| v.as_str()) {
                            return Some(id.to_string());
                        }
                    }
                }
            }
            current = dir.parent();
        } else {
            break;
        }
    }
    None
}

#[tauri::command]
async fn launch_game(window: tauri::Window, executable_path: String) -> Result<bool, String> {
    use std::process::Command;

    let path = PathBuf::from(&executable_path);

    if !path.exists() {
        return Err("Executable not found".to_string());
    }

    let exe_dir = path
        .parent()
        .ok_or_else(|| "Failed to get executable directory".to_string())?;

    // Try to resolve game_id from nearby vapr_game_info.json
    let game_id_opt = resolve_game_id_from_exe_dir(exe_dir);

    // Start process and monitor duration
    let started_at = chrono::Utc::now();
    let start_instant = std::time::Instant::now();

    let mut child = Command::new(&executable_path)
        .current_dir(exe_dir)
        .spawn()
        .map_err(|e| format!("Failed to launch game: {}", e))?;

    let window_clone = window.clone();
    tauri::async_runtime::spawn_blocking(move || {
        // Wait for the game process to exit
        let _ = child.wait();
        let ended_at = chrono::Utc::now();
        let duration_secs = start_instant.elapsed().as_secs();

        // Emit event to frontend so it can record the session
        let payload = serde_json::json!({
            "game_id": game_id_opt,
            "started_at": started_at.to_rfc3339(),
            "ended_at": ended_at.to_rfc3339(),
            "duration_seconds": duration_secs,
            "executable_path": executable_path
        });
        let _ = window_clone.emit("playtime-session", payload);
    });

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

// New WebSocket-related commands
#[tauri::command]
async fn update_sdk_user_info(
    ws_server: State<'_, Arc<WebSocketServer>>,
    user_id: String,
    username: String,
    level: u32,
    xp: u32,
    xp_required: u32,
    avatar: Option<String>,
) -> Result<(), String> {
    let user_info = UserInfo {
        id: user_id,
        username,
        level,
        xp,
        xp_required,
        avatar,
    };

    ws_server.update_user_info(user_info).await;
    Ok(())
}

#[tauri::command]
async fn clear_sdk_user_info(ws_server: State<'_, Arc<WebSocketServer>>) -> Result<(), String> {
    ws_server.clear_user_info().await;
    Ok(())
}

#[tauri::command]
async fn get_sdk_connected_sessions(
    ws_server: State<'_, Arc<WebSocketServer>>,
) -> Result<Vec<String>, String> {
    Ok(ws_server.get_connected_sessions().await)
}

// JS calls this to respond to sdk-request events
#[tauri::command]
async fn sdk_response(
    bridge: State<'_, Arc<SdkBridge>>,
    id: String,
    ok: bool,
    data: Option<JsonValue>,
    error: Option<String>,
) -> Result<(), String> {
    let result = if ok {
        Ok(data.unwrap_or(serde_json::json!({})))
    } else {
        Err(error.unwrap_or_else(|| "Unknown error".to_string()))
    };
    bridge.resolve_response(id, result).await
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
            check_version_compatibility,
            download_and_install_game,
            launch_game,
            get_installed_games,
            uninstall_game,
            update_sdk_user_info,
            clear_sdk_user_info,
            get_sdk_connected_sessions,
            sdk_response,
            start_download,
            pause_download,
            resume_download,
            cancel_download
        ])
        .setup(|app| {
            // Create app state for downloads
            let app_state = AppState {
                downloads: Arc::new(Mutex::new(HashMap::new())),
            };
            app.manage(app_state);

            // Create JS bridge and WebSocket server after Tauri has initialized
            let bridge = Arc::new(SdkBridge::new(app.handle().clone()));
            let ws_server = Arc::new(WebSocketServer::new(bridge.clone()));
            app.manage(ws_server.clone());
            app.manage(bridge.clone());

            tauri::async_runtime::spawn(async move {
                if let Err(e) = ws_server.start(7878).await {
                    eprintln!("Failed to start WebSocket server: {}", e);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}