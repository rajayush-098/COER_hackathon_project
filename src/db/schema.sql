-- ============================================================================
-- Vyapaar AI - Aiven MySQL 8.4 Production Schema
-- Compatible with MySQL 8.4.x (innodb, utf8mb4)
-- Safe & Idempotent: Does not drop or truncate existing user data.
-- ============================================================================

-- 1. Business Profiles Table
-- Stores core applicant & enterprise metadata
CREATE TABLE IF NOT EXISTS `business_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(150) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `block` VARCHAR(100) DEFAULT NULL,
  `village_location` VARCHAR(150) DEFAULT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `experience_level` VARCHAR(50) DEFAULT 'Beginner',
  `udyam_number` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_bp_district_cat` (`district`, `category`),
  INDEX `idx_bp_udyam` (`udyam_number`),
  INDEX `idx_bp_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Business Financial Records Table
-- Stores deterministic calculation outputs and financial metrics
-- Precise DECIMAL types used for rupee values and rates
CREATE TABLE IF NOT EXISTS `business_financial_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT NOT NULL,
  `project_cost` DECIMAL(14, 2) NOT NULL,
  `margin_capital` DECIMAL(14, 2) NOT NULL,
  `eligible_loan` DECIMAL(14, 2) NOT NULL,
  `monthly_revenue` DECIMAL(14, 2) NOT NULL,
  `monthly_expenses` DECIMAL(14, 2) NOT NULL,
  `monthly_profit` DECIMAL(14, 2) NOT NULL,
  `yearly_profit` DECIMAL(14, 2) NOT NULL,
  `monthly_emi` DECIMAL(14, 2) NOT NULL,
  `matched_scheme_name` VARCHAR(150) DEFAULT NULL,
  `interest_rate` DECIMAL(5, 2) DEFAULT NULL,
  `tenure_months` INT DEFAULT NULL,
  `moratorium_months` INT DEFAULT NULL,
  `affordability_status` VARCHAR(100) DEFAULT NULL,
  `feasibility_verdict` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bfr_business_id` (`business_id`),
  INDEX `idx_bfr_scheme` (`matched_scheme_name`),
  CONSTRAINT `fk_bfr_business`
    FOREIGN KEY (`business_id`)
    REFERENCES `business_profiles` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Advisory History Table
-- Retains Q&A dialogue sessions with SAHYOGI / AI Business Advisor
CREATE TABLE IF NOT EXISTS `advisory_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT DEFAULT NULL,
  `session_token` VARCHAR(100) NOT NULL,
  `user_query` TEXT NOT NULL,
  `ai_response` MEDIUMTEXT NOT NULL,
  `language` VARCHAR(20) DEFAULT 'hi',
  `model_source` VARCHAR(50) DEFAULT 'gemini',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_adv_business` (`business_id`, `created_at`),
  INDEX `idx_adv_session` (`session_token`),
  CONSTRAINT `fk_adv_business`
    FOREIGN KEY (`business_id`)
    REFERENCES `business_profiles` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Saved Reports Table (Business Parcha / Dossiers)
-- Formal 1-page feasibility cards generated for bank and Panchayat display
CREATE TABLE IF NOT EXISTS `saved_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `report_code` VARCHAR(50) NOT NULL UNIQUE,
  `business_id` INT DEFAULT NULL,
  `business_name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(150) NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `summary_verdict` VARCHAR(150) NOT NULL,
  `report_payload` JSON NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sr_code` (`report_code`),
  INDEX `idx_sr_district` (`district`, `category`),
  CONSTRAINT `fk_sr_business`
    FOREIGN KEY (`business_id`)
    REFERENCES `business_profiles` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Market Scans Log Table
-- Retains aggregated summary counts from OpenStreetMap field scans
CREATE TABLE IF NOT EXISTS `market_scans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT DEFAULT NULL,
  `district` VARCHAR(100) NOT NULL,
  `latitude` DECIMAL(10, 7) DEFAULT NULL,
  `longitude` DECIMAL(10, 7) DEFAULT NULL,
  `radius_meters` INT NOT NULL,
  `competitor_count` INT DEFAULT 0,
  `bank_count` INT DEFAULT 0,
  `mandi_count` INT DEFAULT 0,
  `scan_source` VARCHAR(50) DEFAULT 'openstreetmap',
  `scanned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ms_district_time` (`district`, `scanned_at`),
  CONSTRAINT `fk_ms_business`
    FOREIGN KEY (`business_id`)
    REFERENCES `business_profiles` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
