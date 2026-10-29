SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `claims`;
DROP TABLE IF EXISTS `item_images`;
DROP TABLE IF EXISTS `items`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `categories`;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Electronics'),
(2, 'ID and Cards'),
(3, 'Clothing'),
(4, 'Bags and Wallets'),
(5, 'Keys'),
(6, 'Accessories'),
(7, 'Water Bottles'),
(8, 'School Supplies'),
(9, 'Others');

-- ------------------------------------------------------------
-- 2. USERS
-- ------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `student_id` VARCHAR(50) DEFAULT NULL,
  `course` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'student') NOT NULL DEFAULT 'student',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_student_id` (`student_id`),
  KEY `idx_users_role_status` (`role`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users`
(`id`, `name`, `student_id`, `course`, `email`, `password_hash`, `role`, `status`) VALUES
(1, 'Sir. Jek Dela Crusito', NULL, NULL, 'admin@gmail.com',
 '$2y$10$wOu51VnihvHKnixUFfFuWe61QV3mFZdSd2iLm9L8FV7BxxVyuYQIK', 'admin', 'active'),
(2, 'Juan Dela Cruz', '2024-00101', 'BSIT 2-A', 'juan.delacruz@example.com',
 '$2y$10$aAKlbSb4iV.W7.2SRV7xRu5.mXae/Mhev09xAVpAXrEIXbdjLBqji', 'student', 'active'),
(3, 'Maria Santos', '2024-00102', 'BSIT 2-A', 'maria.santos@example.com',
 '$2y$10$aAKlbSb4iV.W7.2SRV7xRu5.mXae/Mhev09xAVpAXrEIXbdjLBqji', 'student', 'active'),
(4, 'Pedro Reyes', '2024-00103', 'BSCS 2-A', 'pedro.reyes@example.com',
 '$2y$10$aAKlbSb4iV.W7.2SRV7xRu5.mXae/Mhev09xAVpAXrEIXbdjLBqji', 'student', 'active'),
(5, 'Ana Garcia', '2024-00104', 'BSIT 2-B', 'ana.garcia@example.com',
 '$2y$10$aAKlbSb4iV.W7.2SRV7xRu5.mXae/Mhev09xAVpAXrEIXbdjLBqji', 'student', 'active'),
(6, 'Mark Flores', '2024-00105', 'BSIT 2-A', 'mark.flores@example.com',
 '$2y$10$aAKlbSb4iV.W7.2SRV7xRu5.mXae/Mhev09xAVpAXrEIXbdjLBqji', 'student', 'active'),
(7, 'Leah Mendoza', '2024-00106', 'BSHM 2-A', 'leah.mendoza@example.com',
 '$2y$10$aAKlbSb4iV.W7.2SRV7xRu5.mXae/Mhev09xAVpAXrEIXbdjLBqji', 'student', 'active'),
(8, 'Carlo Ramos', '2024-00107', 'BSIT 2-B', 'carlo.ramos@example.com',
 '$2y$10$aAKlbSb4iV.W7.2SRV7xRu5.mXae/Mhev09xAVpAXrEIXbdjLBqji', 'student', 'active'),
(9, 'Ella Torres', '2024-00108', 'BSCS 2-A', 'ella.torres@example.com',
 '$2y$10$aAKlbSb4iV.W7.2SRV7xRu5.mXae/Mhev09xAVpAXrEIXbdjLBqji', 'student', 'active'),
(10, 'Noah Bautista', '2024-00109', 'BSIT 2-A', 'noah.bautista@example.com',
 '$2y$10$aAKlbSb4iV.W7.2SRV7xRu5.mXae/Mhev09xAVpAXrEIXbdjLBqji', 'student', 'active');

-- ------------------------------------------------------------
-- 3. ITEMS
-- ------------------------------------------------------------
CREATE TABLE `items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `type` ENUM('lost', 'found') NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `item_date` DATE NOT NULL,
  `description` TEXT NOT NULL,
  `contact` VARCHAR(190) DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_items_type_status` (`type`, `status`),
  KEY `idx_items_user_id` (`user_id`),
  KEY `idx_items_category` (`category`),
  CONSTRAINT `fk_items_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `items`
(`id`, `user_id`, `type`, `name`, `category`, `location`, `item_date`, `description`, `contact`, `status`) VALUES
(1, 2, 'lost', 'Student ID Card', 'ID and Cards', 'Library', '2026-10-08', 'Student ID card in a clear plastic holder.', 'juan.delacruz@example.com', 'open'),
(2, 3, 'found', 'Blue Water Bottle', 'Water Bottles', 'Canteen', '2026-10-07', 'Blue reusable water bottle left on a table.', 'maria.santos@example.com', 'open'),
(3, 4, 'lost', 'Wireless Earbuds Case', 'Electronics', 'Computer Laboratory', '2026-10-07', 'Small charging case for wireless earbuds.', 'pedro.reyes@example.com', 'open'),
(4, 5, 'found', 'Black Umbrella', 'Accessories', 'Main entrance', '2026-10-09', 'Black folding umbrella turned in to the office.', 'ana.garcia@example.com', 'open'),
(5, 6, 'lost', 'Black Wallet', 'Bags and Wallets', 'Hallway', '2026-10-10', 'Black wallet with cards inside.', 'mark.flores@example.com', 'open'),
(6, 7, 'found', 'Blue Ballpoint Pen', 'School Supplies', 'Classroom', '2026-10-10', 'Blue ballpoint pen found near a desk.', 'leah.mendoza@example.com', 'open'),
(7, 8, 'lost', 'House Keys', 'Keys', 'Canteen', '2026-10-11', 'Two keys on a small key ring.', 'carlo.ramos@example.com', 'open'),
(8, 9, 'found', 'Gray Hoodie', 'Clothing', 'PE room near canteen', '2026-10-11', 'Gray hooded sweatshirt left in the room.', 'ella.torres@example.com', 'open'),
(9, 10, 'lost', 'USB Flash Drive', 'Electronics', 'Computer Laboratory', '2026-10-12', 'Black USB flash drive with a small label.', 'noah.bautista@example.com', 'open'),
(10, 2, 'found', 'Red Notebook', 'School Supplies', 'Library', '2026-10-12', 'Red spiral notebook found on a reading table.', 'juan.delacruz@example.com', 'open'),
(11, 3, 'lost', 'White Earphones', 'Electronics', 'Classroom', '2026-10-13', 'Wired white earphones.', 'maria.santos@example.com', 'open'),
(12, 4, 'found', 'Brown Card Holder', 'ID and Cards', 'Hallway', '2026-10-13', 'Brown card holder with no visible identification.', 'pedro.reyes@example.com', 'open'),
(13, 5, 'lost', 'Water Bottle', 'Water Bottles', 'PE room near canteen', '2026-10-14', 'Silver water bottle with a dark cap.', 'ana.garcia@example.com', 'open'),
(14, 6, 'found', 'Small Coin Purse', 'Bags and Wallets', 'Canteen', '2026-10-14', 'Small zippered coin purse.', 'mark.flores@example.com', 'open'),
(15, 7, 'lost', 'Eyeglasses', 'Accessories', 'Library', '2026-10-15', 'Eyeglasses in a dark-colored case.', 'leah.mendoza@example.com', 'open'),
(16, 8, 'found', 'Yellow Highlighter', 'School Supplies', 'Classroom', '2026-10-15', 'Yellow highlighter found near the board.', 'carlo.ramos@example.com', 'open'),
(17, 9, 'lost', 'Gray Backpack', 'Bags and Wallets', 'Hallway', '2026-10-16', 'Gray backpack with school notebooks.', 'ella.torres@example.com', 'open'),
(18, 10, 'found', 'Silver Keychain', 'Keys', 'Main entrance', '2026-10-16', 'Silver keychain with one key attached.', 'noah.bautista@example.com', 'open'),
(19, 2, 'lost', 'Blue Ballpen', 'School Supplies', 'Computer Laboratory', '2026-10-17', 'Blue ballpen with a transparent body.', 'juan.delacruz@example.com', 'open'),
(20, 3, 'found', 'Black Cap', 'Clothing', 'Canteen', '2026-10-17', 'Plain black cap left on a chair.', 'maria.santos@example.com', 'open'),
(21, 4, 'lost', 'Small Pouch', 'Others', 'Restroom', '2026-10-18', 'Small fabric pouch with personal items.', 'pedro.reyes@example.com', 'open');

-- ------------------------------------------------------------
-- 4. ITEM IMAGES
-- ------------------------------------------------------------
CREATE TABLE `item_images` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_id` INT UNSIGNED NOT NULL,
  `image_path` VARCHAR(500) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_images_item_id` (`item_id`),
  CONSTRAINT `fk_item_images_item`
    FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `item_images` (`id`, `item_id`, `image_path`) VALUES
(1, 2, 'uploads/blue-water-bottle.jpg'),
(2, 4, 'uploads/black-umbrella.jpg');

-- ------------------------------------------------------------
-- 5. CLAIMS
-- ------------------------------------------------------------
CREATE TABLE `claims` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `office_note` TEXT DEFAULT NULL,
  `reviewed_by` INT UNSIGNED DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_claims_item_id` (`item_id`),
  KEY `idx_claims_user_id` (`user_id`),
  KEY `idx_claims_status` (`status`),
  CONSTRAINT `fk_claims_item`
    FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_claims_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_claims_reviewer`
    FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `claims`
(`id`, `item_id`, `user_id`, `message`, `status`, `office_note`, `reviewed_by`, `reviewed_at`) VALUES
(1, 2, 3, 'This is my bottle; it has a small scratch near the cap.', 'pending', NULL, NULL, NULL),
(2, 4, 5, 'The umbrella has a small mark on the handle.', 'pending', NULL, NULL, NULL),
(3, 6, 7, 'I believe this is my pen; it has my initials on it.', 'approved', 'Claim approved after ownership details were checked.', 1, '2026-10-18 10:30:00'),
(4, 8, 9, 'My hoodie has a small stitched label inside.', 'rejected', 'The provided details did not match the item.', 1, '2026-10-19 13:15:00'),
(5, 10, 2, 'My notebook has notes from my morning class.', 'pending', NULL, NULL, NULL);

-- Helpful checks after importing:
-- SELECT * FROM categories;
-- SELECT * FROM users;
-- SELECT * FROM items;
-- SELECT * FROM item_images;
-- SELECT * FROM claims;
