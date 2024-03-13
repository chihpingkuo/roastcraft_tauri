// SPDX-License-Identifier: GPL-3.0-or-later

use async_trait::async_trait;
use serde_json::Value;
use std::io::Error;
use tauri::{AppHandle, Manager};

use super::Device;
use crate::config::Config;

pub struct HttpDevice {
    config: Config,
    client: reqwest::Client,
    app: AppHandle,
}

impl HttpDevice {
    pub fn new(config: Config, app: &AppHandle) -> HttpDevice {
        let client = reqwest::Client::new();

        HttpDevice {
            config,
            client,
            app: app.clone(),
        }
    }
}

#[async_trait]
impl Device for HttpDevice {
    async fn read(self: &mut Self) -> Result<Value, Error> {
        let mut res_json: Value = Value::Null;

        // read channels
        let config = &self.config;
        let tcp = config.tcp.as_ref().unwrap();

        let url = format!("http://{}:{}", tcp.ip, tcp.port);

        let req = self.client.get(url);
        match req.send().await {
            Ok(res) => {
                let res_str = res.text().await.unwrap();
                res_json = serde_json::from_str(&res_str).unwrap();
            }
            Err(err) => {
                self.app.emit_all("log_event", err.to_string()).unwrap();
            }
        }

        Ok(res_json)
    }
}
