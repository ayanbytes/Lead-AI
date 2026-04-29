-- Lead Magnet AI - Auth schema
-- Run this in MySQL Workbench (Query tab) against your DB (default: lead_magnet_ai).

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_email (email)
);

CREATE TABLE IF NOT EXISTS audits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(120) NOT NULL DEFAULT 'General',
  website VARCHAR(512) NULL,
  request_json JSON NOT NULL,
  result_json JSON NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Success',
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_audits_user_id (user_id),
  KEY ix_audits_company_name (company_name),
  CONSTRAINT fk_audits_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
