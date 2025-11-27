-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: lili_hotel
-- ------------------------------------------------------
-- Server version	8.0.43-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `username` varchar(50) NOT NULL COMMENT '用戶名',
  `email` varchar(100) NOT NULL COMMENT '郵箱',
  `password_hash` varchar(255) NOT NULL COMMENT '密碼雜湊',
  `full_name` varchar(100) DEFAULT NULL COMMENT '全名',
  `role` enum('ADMIN','MARKETING','CUSTOMER_SERVICE') NOT NULL COMMENT '角色',
  `is_active` tinyint(1) DEFAULT NULL COMMENT '是否啟用',
  `last_login_at` datetime DEFAULT NULL COMMENT '最後登入時間',
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主鍵ID',
  `created_at` datetime NOT NULL COMMENT '創建時間',
  `updated_at` datetime DEFAULT NULL COMMENT '更新時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('admin@test.com','admin@test.com','$2b$12$rVqIKaQwm5Mi3/BhDDoaeeb4cGDs98DcWN0dX93XJvvVk4Ror4CP.','測試管理員','ADMIN',1,'2025-11-20 02:45:27',1,'2025-11-15 16:46:25','2025-11-20 02:45:27'),('admin','admin@lilihotel.com','$2b$12$a.vBw0qeywcW1YuQ1Nhv2exKmj33YJVDmnlWNscEvo/AWwOtjOiUi','系統管理員','ADMIN',1,'2025-11-25 02:25:37',2,'2025-11-17 21:03:41','2025-11-25 02:25:37');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `line_oa_configs`
--

DROP TABLE IF EXISTS `line_oa_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `line_oa_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_id` bigint NOT NULL COMMENT '所屬管理員',
  `channel_id` varchar(20) DEFAULT NULL COMMENT 'Messaging API Channel ID（10位數字）',
  `channel_secret` varchar(50) DEFAULT NULL COMMENT 'Messaging API Channel Secret（32字元英數字）',
  `channel_access_token` varchar(255) DEFAULT NULL COMMENT 'Messaging API Channel Access Token',
  `line_account_id` varchar(50) DEFAULT NULL COMMENT 'LINE 官方帳號 ID，如 @262qaash',
  `webhook_enabled` tinyint(1) DEFAULT NULL COMMENT 'Webhook 是否已開啟',
  `is_verified` tinyint(1) DEFAULT NULL COMMENT '是否已完成 LINE 驗證',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
  `updated_at` datetime DEFAULT NULL COMMENT '最後更新時間',
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `line_oa_configs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `line_oa_configs`
--

LOCK TABLES `line_oa_configs` WRITE;
/*!40000 ALTER TABLE `line_oa_configs` DISABLE KEYS */;
/*!40000 ALTER TABLE `line_oa_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_configs`
--

DROP TABLE IF EXISTS `login_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_id` bigint NOT NULL COMMENT '所屬管理員',
  `channel_id` varchar(20) DEFAULT NULL COMMENT 'Login Channel ID（以165開頭的10位數字）',
  `channel_secret` varchar(50) DEFAULT NULL COMMENT 'Login Channel Secret（32位大小寫英數字）',
  `is_verified` tinyint(1) DEFAULT NULL COMMENT '是否已完成 LINE 驗證',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
  `updated_at` datetime DEFAULT NULL COMMENT '最後更新時間',
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `login_configs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_configs`
--

LOCK TABLES `login_configs` WRITE;
/*!40000 ALTER TABLE `login_configs` DISABLE KEYS */;
/*!40000 ALTER TABLE `login_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_sessions`
--

DROP TABLE IF EXISTS `login_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_id` bigint NOT NULL COMMENT '所屬管理員',
  `login_method` varchar(20) DEFAULT NULL COMMENT '登入方式：email_password / google / line',
  `login_time` datetime NOT NULL COMMENT '登入時間（UTC+8 時區）',
  `expire_time` datetime DEFAULT NULL COMMENT '會話過期時間',
  `device_info` text COMMENT '裝置資訊',
  `is_active` tinyint(1) DEFAULT NULL COMMENT '會話是否有效',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
  `updated_at` datetime DEFAULT NULL COMMENT '更新時間',
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `login_sessions_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_sessions`
--

LOCK TABLES `login_sessions` WRITE;
/*!40000 ALTER TABLE `login_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `login_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_authorizations`
--

DROP TABLE IF EXISTS `system_authorizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_authorizations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_id` bigint NOT NULL COMMENT '所屬管理員',
  `expire_date` date NOT NULL COMMENT '授權到期日',
  `is_active` tinyint(1) DEFAULT NULL COMMENT '授權是否有效',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
  `updated_at` datetime DEFAULT NULL COMMENT '更新時間',
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `system_authorizations_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_authorizations`
--

LOCK TABLES `system_authorizations` WRITE;
/*!40000 ALTER TABLE `system_authorizations` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_authorizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auto_response_keywords`
--

DROP TABLE IF EXISTS `auto_response_keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auto_response_keywords` (
  `auto_response_id` bigint NOT NULL COMMENT '自動回應ID',
  `keyword` varchar(50) NOT NULL COMMENT '關鍵字',
  `match_count` int DEFAULT NULL COMMENT '匹配次數',
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主鍵ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `match_type` varchar(20) NOT NULL DEFAULT 'exact' COMMENT '比對類型：exact（完全匹配）',
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否啟用此關鍵字',
  `last_triggered_at` datetime DEFAULT NULL COMMENT '最近觸發時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_auto_response_keyword` (`auto_response_id`,`keyword`),
  KEY `ix_auto_response_keywords_auto_response_id` (`auto_response_id`),
  KEY `idx_keyword_enabled` (`auto_response_id`,`is_enabled`),
  CONSTRAINT `auto_response_keywords_ibfk_1` FOREIGN KEY (`auto_response_id`) REFERENCES `auto_responses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auto_response_keywords`
--

LOCK TABLES `auto_response_keywords` WRITE;
/*!40000 ALTER TABLE `auto_response_keywords` DISABLE KEYS */;
/*!40000 ALTER TABLE `auto_response_keywords` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_deliveries`
--

DROP TABLE IF EXISTS `message_deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_deliveries` (
  `message_id` bigint NOT NULL COMMENT '群發訊息ID',
  `member_id` bigint NOT NULL COMMENT '會員ID',
  `sent_at` datetime DEFAULT NULL COMMENT '發送時間',
  `opened_at` datetime DEFAULT NULL COMMENT '開啟時間',
  `clicked_at` datetime DEFAULT NULL COMMENT '點擊時間',
  `delivery_status` varchar(20) NOT NULL DEFAULT 'pending',
  `failure_reason` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
  `updated_at` datetime DEFAULT NULL COMMENT '更新時間',
  `delivery_id` varchar(50) NOT NULL,
  PRIMARY KEY (`delivery_id`),
  UNIQUE KEY `uq_message_delivery_member` (`message_id`,`member_id`),
  KEY `ix_message_deliveries_message_id` (`message_id`),
  KEY `ix_message_deliveries_member_id` (`member_id`),
  KEY `ix_message_deliveries_member_status` (`member_id`,`delivery_status`),
  KEY `ix_message_deliveries_sent_at` (`sent_at`),
  CONSTRAINT `fk_message_deliveries_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_deliveries_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_deliveries`
--

LOCK TABLES `message_deliveries` WRITE;
/*!40000 ALTER TABLE `message_deliveries` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_deliveries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `template_carousel_items`
--

DROP TABLE IF EXISTS `template_carousel_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_carousel_items` (
  `template_id` bigint NOT NULL COMMENT '模板ID',
  `image_url` varchar(500) NOT NULL COMMENT '圖片URL',
  `title` varchar(100) DEFAULT NULL COMMENT '標題',
  `description` varchar(200) DEFAULT NULL COMMENT '描述',
  `price` decimal(10,2) DEFAULT NULL COMMENT '金額',
  `action_url` varchar(500) DEFAULT NULL COMMENT '動作URL',
  `interaction_tag_id` bigint DEFAULT NULL COMMENT '互動標籤ID',
  `action_button_text` varchar(100) DEFAULT NULL COMMENT '動作按鈕文字',
  `action_button_enabled` tinyint(1) DEFAULT NULL COMMENT '動作按鈕啟用',
  `action_button_interaction_type` varchar(50) DEFAULT NULL COMMENT '動作按鈕互動類型',
  `action_button_url` varchar(500) DEFAULT NULL COMMENT '動作按鈕網址',
  `action_button_trigger_message` text COMMENT '動作按鈕觸發訊息',
  `action_button_trigger_image_url` varchar(500) DEFAULT NULL COMMENT '動作按鈕觸發圖片URL',
  `action_button2_text` varchar(100) DEFAULT NULL COMMENT '第二個動作按鈕文字',
  `action_button2_enabled` tinyint(1) DEFAULT NULL COMMENT '第二個動作按鈕啟用',
  `action_button2_interaction_type` varchar(50) DEFAULT NULL COMMENT '第二個動作按鈕互動類型',
  `action_button2_url` varchar(500) DEFAULT NULL COMMENT '第二個動作按鈕網址',
  `action_button2_trigger_message` text COMMENT '第二個動作按鈕觸發訊息',
  `action_button2_trigger_image_url` varchar(500) DEFAULT NULL COMMENT '第二個動作按鈕觸發圖片URL',
  `image_aspect_ratio` varchar(10) NOT NULL COMMENT '圖片長寬比例',
  `image_click_action_type` varchar(50) NOT NULL COMMENT '圖片點擊動作類型',
  `image_click_action_value` text COMMENT '圖片點擊動作值',
  `sort_order` int DEFAULT NULL COMMENT '排序',
  `click_count` int DEFAULT NULL COMMENT '點擊次數',
  `unique_click_count` int DEFAULT NULL COMMENT '唯一點擊次數',
  `last_clicked_at` datetime DEFAULT NULL COMMENT '最後點擊時間',
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主鍵ID',
  `created_at` datetime NOT NULL COMMENT '創建時間',
  `updated_at` datetime DEFAULT NULL COMMENT '更新時間',
  PRIMARY KEY (`id`),
  KEY `interaction_tag_id` (`interaction_tag_id`),
  KEY `ix_template_carousel_items_template_id` (`template_id`),
  CONSTRAINT `template_carousel_items_ibfk_1` FOREIGN KEY (`interaction_tag_id`) REFERENCES `interaction_tags` (`id`),
  CONSTRAINT `template_carousel_items_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `message_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `template_carousel_items`
--

LOCK TABLES `template_carousel_items` WRITE;
/*!40000 ALTER TABLE `template_carousel_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `template_carousel_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-27 13:31:32
