
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![download])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn download(name: String, data: Vec<u8>) {
    let Ok(dir) = std::env::current_dir() else {
        return;
    };
    let _ = std::fs::write(dir.join(name), data);
}
