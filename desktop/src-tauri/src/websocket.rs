use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{broadcast, RwLock};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use uuid::Uuid;
use chrono::Local;

// Add a macro for timestamped debug logs
macro_rules! debug_log {
    ($($arg:tt)*) => {
        println!("[{}] {}", Local::now().format("%Y-%m-%d %H:%M:%S%.3f"), format!($($arg)*));
    };
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: String,
    pub username: String,
    pub level: u32,
    pub xp: u32,
    pub xp_required: u32,
    pub avatar: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum WebSocketMessage {
    // Messages from game to launcher
    GetUserInfo,
    Ping,

    // Messages from launcher to game
    UserInfo(UserInfo),
    Pong,
    Error { message: String },

    // Events
    UserUpdated(UserInfo),
    ConnectionEstablished { session_id: String },
}

#[derive(Clone)]
pub struct WebSocketServer {
    connections: Arc<RwLock<HashMap<String, broadcast::Sender<WebSocketMessage>>>>,
    user_info: Arc<RwLock<Option<UserInfo>>>,
}

impl WebSocketServer {
    pub fn new() -> Self {
        debug_log!("Creating new WebSocket server instance");
        Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
            user_info: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn start(&self, port: u16) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let addr: SocketAddr = format!("127.0.0.1:{}", port).parse()?;
        debug_log!("Attempting to bind to address: {}", addr);

        let listener = TcpListener::bind(&addr).await?;
        debug_log!("✓ VAPR SDK WebSocket server successfully listening on: {}", addr);

        loop {
            match listener.accept().await {
                Ok((stream, addr)) => {
                    debug_log!("New TCP connection accepted from: {}", addr);
                    let server = self.clone();

                    tokio::spawn(async move {
                        debug_log!("Spawning connection handler for: {}", addr);
                        if let Err(e) = server.handle_connection(stream, addr).await {
                            debug_log!("❌ Error handling connection from {}: {}", addr, e);
                        }
                    });
                }
                Err(e) => {
                    debug_log!("❌ Error accepting connection: {}", e);
                }
            }
        }
    }

    async fn handle_connection(
        &self,
        stream: TcpStream,
        addr: SocketAddr,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        debug_log!("Starting WebSocket handshake for: {}", addr);

        let ws_stream = match accept_async(stream).await {
            Ok(ws) => {
                debug_log!("✓ WebSocket handshake successful for: {}", addr);
                ws
            }
            Err(e) => {
                debug_log!("❌ WebSocket handshake failed for {}: {}", addr, e);
                return Err(e.into());
            }
        };

        let (ws_sender, mut ws_receiver) = ws_stream.split();

        // Wrap the sender in Arc<RwLock> so it can be shared between tasks
        let ws_sender = Arc::new(RwLock::new(ws_sender));

        let session_id = Uuid::new_v4().to_string();
        let (tx, mut rx) = broadcast::channel(100);

        // Store the connection
        {
            let mut connections = self.connections.write().await;
            let conn_count = connections.len();
            connections.insert(session_id.clone(), tx.clone());
            debug_log!("✓ Connection stored - Session: {} | Total connections: {} → {}",
                      session_id, conn_count, conn_count + 1);
        }

        debug_log!("New WebSocket connection established - Address: {} | Session: {}", addr, session_id);

        // Send connection established message
        let welcome_msg = WebSocketMessage::ConnectionEstablished {
            session_id: session_id.clone(),
        };
        {
            debug_log!("Sending welcome message to session: {}", session_id);
            let mut sender = ws_sender.write().await;
            match sender.send(Message::Text(serde_json::to_string(&welcome_msg)?)).await {
                Ok(_) => debug_log!("✓ Welcome message sent successfully"),
                Err(e) => debug_log!("❌ Failed to send welcome message: {}", e),
            }
        }

        // Send current user info if available
        if let Some(user_info) = self.user_info.read().await.clone() {
            debug_log!("User info available - Username: {} | Level: {} | XP: {}/{}",
                      user_info.username, user_info.level, user_info.xp, user_info.xp_required);
            let msg = WebSocketMessage::UserInfo(user_info);
            let mut sender = ws_sender.write().await;
            match sender.send(Message::Text(serde_json::to_string(&msg)?)).await {
                Ok(_) => debug_log!("✓ User info sent to new connection"),
                Err(e) => debug_log!("❌ Failed to send user info: {}", e),
            }
        } else {
            debug_log!("No user info available to send");
        }

        // Spawn task to handle messages from the launcher to the game
        let ws_sender_clone = ws_sender.clone();
        let session_id_clone = session_id.clone();
        let _rx_task = tokio::spawn(async move {
            debug_log!("Starting broadcast receiver task for session: {}", session_id_clone);
            let mut msg_count = 0;

            while let Ok(msg) = rx.recv().await {
                msg_count += 1;
                debug_log!("Broadcasting message #{} to session {}: {:?}",
                          msg_count, session_id_clone, msg);

                if let Ok(json) = serde_json::to_string(&msg) {
                    let mut sender = ws_sender_clone.write().await;
                    if let Err(e) = sender.send(Message::Text(json)).await {
                        debug_log!("❌ Failed to broadcast message to session {}: {}",
                                  session_id_clone, e);
                        break;
                    }
                } else {
                    debug_log!("❌ Failed to serialize message for broadcast");
                }
            }
            debug_log!("Broadcast receiver task ending for session: {} (sent {} messages)",
                      session_id_clone, msg_count);
        });

        // Handle messages from the game
        let server = self.clone();
        let session_id_for_logging = session_id.clone();
        let message_result = async {
            let mut msg_count = 0;

            while let Some(msg) = ws_receiver.next().await {
                msg_count += 1;
                debug_log!("Received message #{} from session {}", msg_count, session_id_for_logging);

                match msg {
                    Ok(Message::Text(text)) => {
                        debug_log!("Message type: Text | Length: {} | Content: {}",
                                  text.len(),
                                  if text.len() > 100 {
                                      format!("{}...", &text[..100])
                                  } else {
                                      text.clone()
                                  });

                        match serde_json::from_str::<WebSocketMessage>(&text) {
                            Ok(ws_msg) => {
                                debug_log!("✓ Successfully parsed message: {:?}", ws_msg);
                                server.handle_message(ws_msg, &session_id).await?;
                            }
                            Err(e) => {
                                debug_log!("❌ Failed to parse message: {} | Error: {}", text, e);
                            }
                        }
                    }
                    Ok(Message::Close(frame)) => {
                        debug_log!("WebSocket close frame received for session: {} | Frame: {:?}",
                                  session_id, frame);
                        break;
                    }
                    Ok(Message::Ping(data)) => {
                        debug_log!("Ping received (size: {} bytes) - sending pong", data.len());
                        let mut sender = ws_sender.write().await;
                        if let Err(e) = sender.send(Message::Pong(data)).await {
                            debug_log!("❌ Failed to send pong: {}", e);
                        }
                    }
                    Ok(Message::Pong(data)) => {
                        debug_log!("Pong received (size: {} bytes)", data.len());
                    }
                    Ok(Message::Binary(data)) => {
                        debug_log!("Binary message received (size: {} bytes) - ignoring", data.len());
                    }
                    Ok(Message::Frame(_)) => {
                        debug_log!("Raw frame received - ignoring");
                    }
                    Err(e) => {
                        debug_log!("❌ WebSocket error for session {}: {}", session_id, e);
                        break;
                    }
                }
            }
            debug_log!("Message handling loop ended for session: {} (processed {} messages)",
                      session_id, msg_count);
            Ok::<(), Box<dyn std::error::Error + Send + Sync>>(())
        }.await;

        // Cleanup
        {
            let mut connections = self.connections.write().await;
            let conn_count = connections.len();
            connections.remove(&session_id);
            debug_log!("✓ Connection removed - Session: {} | Total connections: {} → {}",
                      session_id, conn_count, conn_count - 1);
        }

        debug_log!("Connection fully closed for session: {} | Address: {}", session_id, addr);
        message_result
    }

    async fn handle_message(
        &self,
        message: WebSocketMessage,
        session_id: &str,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        debug_log!("Handling message for session {}: {:?}", session_id, message);

        let connections = self.connections.read().await;
        let tx = match connections.get(session_id) {
            Some(tx) => tx,
            None => {
                debug_log!("❌ Connection not found for session: {}", session_id);
                return Err("Connection not found".into());
            }
        };

        match message {
            WebSocketMessage::GetUserInfo => {
                debug_log!("Processing GetUserInfo request");
                if let Some(user_info) = self.user_info.read().await.clone() {
                    debug_log!("✓ Sending user info: {:?}", user_info);
                    tx.send(WebSocketMessage::UserInfo(user_info))?;
                } else {
                    debug_log!("⚠ No user info available - sending error");
                    tx.send(WebSocketMessage::Error {
                        message: "User not logged in".to_string(),
                    })?;
                }
            }
            WebSocketMessage::Ping => {
                debug_log!("Processing Ping - sending Pong");
                tx.send(WebSocketMessage::Pong)?;
            }
            _ => {
                debug_log!("⚠ Ignoring unexpected message type from game: {:?}", message);
            }
        }

        Ok(())
    }

    pub async fn update_user_info(&self, user_info: UserInfo) {
        debug_log!("Updating user info: {:?}", user_info);
        *self.user_info.write().await = Some(user_info.clone());

        // Broadcast to all connected games
        let connections = self.connections.read().await;
        let connection_count = connections.len();
        debug_log!("Broadcasting user update to {} connections", connection_count);

        let mut success_count = 0;
        let mut fail_count = 0;

        for (session_id, tx) in connections.iter() {
            match tx.send(WebSocketMessage::UserUpdated(user_info.clone())) {
                Ok(_) => {
                    success_count += 1;
                    debug_log!("✓ User update sent to session: {}", session_id);
                }
                Err(e) => {
                    fail_count += 1;
                    debug_log!("❌ Failed to send user update to session {}: {}", session_id, e);
                }
            }
        }

        debug_log!("User update broadcast complete - Success: {} | Failed: {}",
                  success_count, fail_count);
    }

    pub async fn clear_user_info(&self) {
        debug_log!("Clearing user info");
        *self.user_info.write().await = None;
    }

    pub async fn get_connected_sessions(&self) -> Vec<String> {
        let sessions: Vec<String> = self.connections.read().await.keys().cloned().collect();
        debug_log!("Current sessions ({}): {:?}", sessions.len(), sessions);
        sessions
    }
}