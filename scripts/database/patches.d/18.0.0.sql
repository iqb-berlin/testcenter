CREATE TABLE assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_original_name (original_name)
);

CREATE TABLE asset_assignment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT NOT NULL DEFAULT 0 COMMENT 'Only used with source to delete XML assignments by workspace file source, not for group/user scoping.',
  source VARCHAR(255) NULL COMMENT 'XML file source used with workspace_id for delete-by-source cleanup, not for group/user scoping.',
  slot_name VARCHAR(100) NOT NULL,
  asset_id INT NOT NULL,
  scope ENUM('global', 'group', 'user') NOT NULL,
  scope_id VARCHAR(100) NOT NULL DEFAULT 'global', -- group/login ID
  UNIQUE KEY unique_assignment (workspace_id, slot_name, scope, scope_id),
  KEY idx_scope (scope, scope_id),
  KEY idx_asset_assignment_source (workspace_id, source),
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);
