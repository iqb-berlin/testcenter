CREATE TABLE assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_assignment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slot_name VARCHAR(100) NOT NULL,
  asset_id INT NOT NULL,
  scope ENUM('global', 'group', 'user') NOT NULL,
  scope_id VARCHAR(100) NOT NULL DEFAULT 'global', -- group/login ID
  UNIQUE KEY unique_assignment (slot_name, scope, scope_id),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);
