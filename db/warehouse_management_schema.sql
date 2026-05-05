-- db/warehouse_management_schema.sql

CREATE DATABASE IF NOT EXISTS omni_warehouse_mgmt;
USE omni_warehouse_mgmt;

CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('Creating', 'Running', 'Failed', 'Deleting', 'Deleted') DEFAULT 'Creating',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    api_status ENUM('running', 'stopped', 'unknown') DEFAULT 'unknown',
    db_status ENUM('running', 'stopped', 'unknown') DEFAULT 'unknown'
);

CREATE TABLE IF NOT EXISTS backups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL,
    backup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    size_mb DECIMAL(10, 2) NOT NULL,
    file_url VARCHAR(500),
    status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Completed',
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);
