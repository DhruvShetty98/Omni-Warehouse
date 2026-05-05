-- db/warehouse_reports_schema.sql

CREATE DATABASE IF NOT EXISTS omni_warehouse_reports;
USE omni_warehouse_reports;

-- Stores historical cumulative global reports
CREATE TABLE IF NOT EXISTS global_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_sales DECIMAL(15, 2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    total_warehouses INT DEFAULT 0,
    report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores high level report data for each warehouse
CREATE TABLE IF NOT EXISTS warehouse_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL,
    total_sales DECIMAL(15, 2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    inventory_used INT DEFAULT 0,
    report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores detailed product-level data per warehouse report
CREATE TABLE IF NOT EXISTS warehouse_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_report_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity_sold INT DEFAULT 0,
    remaining_stock INT DEFAULT 0,
    FOREIGN KEY (warehouse_report_id) REFERENCES warehouse_reports(id) ON DELETE CASCADE
);
