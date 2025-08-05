-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 05, 2025 at 09:15 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `final`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `cart_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `category_name`) VALUES
(1, 'bracelet'),
(2, 'necklace'),
(3, 'ring'),
(4, 'earring');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `item_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_price` double(10,2) NOT NULL,
  `item_desc` text NOT NULL,
  `item_img` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`item_id`, `item_name`, `item_price`, `item_desc`, `item_img`, `created_at`, `updated_at`) VALUES
(1, 'Gold Bracelet', 199.99, 'A beautiful 24K gold bracelet, perfect for any occasion.', 'gold_bracelet.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(2, 'Silver Necklace', 149.99, 'A delicate sterling silver necklace with a pendant.', 'silver_necklace.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(3, 'Diamond Ring', 999.99, 'A stunning diamond ring, crafted with precision and elegance.', 'diamond_ring.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(4, 'Pearl Earrings', 79.99, 'Elegant pearl earrings that add a touch of sophistication.', 'pearl_earrings.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(5, 'Leather Bracelet', 49.99, 'Stylish leather bracelet with stainless steel accents.', 'leather_bracelet.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(6, 'Gold Necklace', 299.99, 'Exquisite gold necklace with intricate design.', 'gold_necklace.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(7, 'Sapphire Ring', 499.99, 'A stunning ring with a deep blue sapphire centerpiece.', 'sapphire_ring.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(8, 'Crystal Earrings', 29.99, 'Gorgeous crystal drop earrings, perfect for formal events.', 'crystal_earrings.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(9, 'Silver Cuff Bracelet', 89.99, 'Minimalistic and elegant silver cuff bracelet.', 'silver_cuff_bracelet.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(10, 'Gold Hoop Earrings', 69.99, 'Classic gold hoop earrings, a timeless addition to your collection.', 'gold_hoop_earrings.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(11, 'Platinum Necklace', 399.99, 'A luxurious platinum necklace with a diamond charm.', 'platinum_necklace.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(12, 'Emerald Ring', 699.99, 'A rich green emerald ring with a vintage design.', 'emerald_ring.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(13, 'Rose Gold Bracelet', 129.99, 'Stylish rose gold bracelet with an adjustable clasp.', 'rose_gold_bracelet.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(14, 'Tungsten Wedding Band', 159.99, 'A durable tungsten wedding band with a polished finish.', 'tungsten_wedding_band.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(15, 'Opal Earrings', 89.99, 'Colorful opal earrings that shimmer in the light.', 'opal_earrings.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(16, 'Turquoise Necklace', 79.99, 'Beautiful turquoise necklace with a boho vibe.', 'turquoise_necklace.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(17, 'Amethyst Ring', 249.99, 'A rich purple amethyst ring with sterling silver setting.', 'amethyst_ring.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(18, 'Diamond Stud Earrings', 349.99, 'Classic diamond stud earrings, perfect for everyday wear.', 'diamond_stud_earrings.jpg', '2025-08-05 08:40:35', '2025-08-05 08:40:35'),
(19, 'Stainless Steel Bracelet', 39.99, 'Sleek stainless steel bracelet, stylish and durable.', 'storage/items/mainImage-1754357865646-491734919.jpg', '2025-08-05 08:40:35', '2025-08-05 09:37:45'),
(20, 'Vintage Necklace', 199.99, 'A vintage-inspired necklace with intricate detailing.', 'storage/items/mainImage-1754356576205-388707918.jpg', '2025-08-05 08:40:35', '2025-08-05 09:32:21');

-- --------------------------------------------------------

--
-- Table structure for table `item_category`
--

CREATE TABLE `item_category` (
  `item_id` int(20) NOT NULL,
  `category_id` int(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item_category`
--

INSERT INTO `item_category` (`item_id`, `category_id`) VALUES
(19, 1),
(20, 2);

-- --------------------------------------------------------

--
-- Table structure for table `item_gallery`
--

CREATE TABLE `item_gallery` (
  `img_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `item_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item_gallery`
--

INSERT INTO `item_gallery` (`img_id`, `item_id`, `item_path`) VALUES
(1, 20, 'storage/items/galleryImages-1754356576207-582856772.jpg'),
(2, 20, 'storage/items/galleryImages-1754356576226-964238405.jpg'),
(3, 20, 'storage/items/galleryImages-1754356576235-114059030.jpg'),
(4, 20, 'storage/items/galleryImages-1754356576239-459131911.jpg'),
(5, 20, 'storage/items/galleryImages-1754356576242-338196068.jpg'),
(6, 19, 'storage/items/galleryImages-1754357865652-485463792.jpg'),
(7, 19, 'storage/items/galleryImages-1754357865659-105814350.jpg'),
(8, 19, 'storage/items/galleryImages-1754357865665-565830584.jpg'),
(9, 19, 'storage/items/galleryImages-1754357865676-892853312.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `orderlines`
--

CREATE TABLE `orderlines` (
  `orderline_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `qty` int(11) NOT NULL,
  `order_price` double(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orderlines`
--

INSERT INTO `orderlines` (`orderline_id`, `order_id`, `item_id`, `qty`, `order_price`) VALUES
(1, 1, 15, 1, 89.99),
(2, 1, 14, 2, 159.99),
(3, 2, 19, 4, 39.99);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `order_status` enum('pending','shipped','cancelled','','delivered') NOT NULL DEFAULT 'pending',
  `order_placed` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `user_id`, `order_status`, `order_placed`) VALUES
(1, 21, 'shipped', '2025-08-05 08:43:02'),
(2, 21, 'pending', '2025-08-05 13:31:30');

-- --------------------------------------------------------

--
-- Table structure for table `stocks`
--

CREATE TABLE `stocks` (
  `stock_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stocks`
--

INSERT INTO `stocks` (`stock_id`, `item_id`, `qty`) VALUES
(1, 1, 100),
(2, 2, 150),
(3, 3, 50),
(4, 4, 200),
(5, 5, 120),
(6, 6, 80),
(7, 7, 60),
(8, 8, 250),
(9, 9, 75),
(10, 10, 180),
(11, 11, 90),
(12, 12, 40),
(13, 13, 110),
(14, 14, 128),
(15, 15, 159),
(16, 16, 100),
(17, 17, 50),
(18, 18, 200),
(19, 19, 86),
(20, 20, 80);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` text NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `contact` varchar(20) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `img` text DEFAULT NULL,
  `token` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `name`, `email`, `password`, `role`, `contact`, `city`, `is_active`, `img`, `token`, `created_at`, `updated_at`) VALUES
(1, 'John Doe', 'john.doe@example.com', 'password123', 'user', '123-456-7890', 'New York', 1, 'john_doe.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(2, 'Jane Smith', 'jane.smith@example.com', 'password123', 'user', '123-456-7891', 'Los Angeles', 1, 'jane_smith.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(3, 'Alice Johnson', 'alice.johnson@example.com', 'password123', 'admin', '123-456-7892', 'Chicago', 1, 'alice_johnson.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(4, 'Bob Brown', 'bob.brown@example.com', 'password123', 'user', '123-456-7893', 'Houston', 1, 'bob_brown.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(5, 'Charlie White', 'charlie.white@example.com', 'password123', 'user', '123-456-7894', 'Phoenix', 1, 'charlie_white.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(6, 'David Green', 'david.green@example.com', 'password123', 'admin', '123-456-7895', 'Philadelphia', 1, 'david_green.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(7, 'Eva Black', 'eva.black@example.com', 'password123', 'user', '123-456-7896', 'San Antonio', 1, 'eva_black.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(8, 'Frank Harris', 'frank.harris@example.com', 'password123', 'user', '123-456-7897', 'San Diego', 1, 'frank_harris.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(9, 'Grace Martinez', 'grace.martinez@example.com', 'password123', 'user', '123-456-7898', 'Dallas', 1, 'grace_martinez.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(10, 'Henry Clark', 'henry.clark@example.com', 'password123', 'user', '123-456-7899', 'San Jose', 1, 'henry_clark.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(11, 'Isabel Lewis', 'isabel.lewis@example.com', 'password123', 'admin', '123-456-7900', 'Austin', 1, 'isabel_lewis.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(12, 'James Walker', 'james.walker@example.com', 'password123', 'user', '123-456-7901', 'Fort Worth', 1, 'james_walker.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(13, 'Kimberly Allen', 'kimberly.allen@example.com', 'password123', 'user', '123-456-7902', 'Columbus', 1, 'kimberly_allen.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(14, 'Liam Young', 'liam.young@example.com', 'password123', 'user', '123-456-7903', 'Indianapolis', 1, 'liam_young.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(15, 'Megan King', 'megan.king@example.com', 'password123', 'admin', '123-456-7904', 'Charlotte', 1, 'megan_king.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(16, 'Nathan Scott', 'nathan.scott@example.com', 'password123', 'user', '123-456-7905', 'Seattle', 1, 'nathan_scott.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(17, 'Olivia Adams', 'olivia.adams@example.com', 'password123', 'user', '123-456-7906', 'Denver', 1, 'olivia_adams.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(18, 'Paul Nelson', 'paul.nelson@example.com', 'password123', 'user', '123-456-7907', 'Washington, D.C.', 1, 'paul_nelson.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(19, 'Quinn Carter', 'quinn.carter@example.com', 'password123', 'user', '123-456-7908', 'Boston', 1, 'quinn_carter.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(20, 'Rachel Perez', 'rachel.perez@example.com', 'password123', 'user', '123-456-7909', 'Detroit', 1, 'rachel_perez.jpg', NULL, '2025-08-05 08:35:28', '2025-08-05 08:35:28'),
(21, 'melvin catuera', 'melvs@gmail.com', '$2b$10$Nxoe79YoO6m8YrCpuzo3Iu/sq/1OTwx.9kQGWpHcryyIfrR5yGzdi', 'user', NULL, NULL, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjEsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU0MzcyNDQ0LCJleHAiOjE3NTQ0NTg4NDR9.IjHeGiQCQYNSQSKi1GrBWtp5igaEDJB9enYXjOwoXoE', '2025-08-05 08:42:17', NULL),
(22, 'yhanskie', 'yhanskie@gmail.com', '$2b$10$lJncaY.Ou1U7NjcItA/dpefy6bGcm9v55PVkvMy.JxtNUNxg5oyqm', 'admin', NULL, NULL, 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDM1NjM4MCwiZXhwIjoxNzU0NDQyNzgwfQ.OGvhfIUKv9XWHJehfT5ST8bHDNa61qFppC3Bwuc9bfg', '2025-08-05 09:12:06', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`cart_id`),
  ADD KEY `fk_user` (`user_id`),
  ADD KEY `fk_item` (`item_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `item_category`
--
ALTER TABLE `item_category`
  ADD UNIQUE KEY `item_id` (`item_id`),
  ADD KEY `fk_category_id` (`category_id`);

--
-- Indexes for table `item_gallery`
--
ALTER TABLE `item_gallery`
  ADD PRIMARY KEY (`img_id`),
  ADD KEY `item_gallery_fk` (`item_id`);

--
-- Indexes for table `orderlines`
--
ALTER TABLE `orderlines`
  ADD PRIMARY KEY (`orderline_id`),
  ADD KEY `fk_orderline_orders` (`order_id`),
  ADD KEY `fk_orderline_item` (`item_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `fk_orders_user` (`user_id`);

--
-- Indexes for table `stocks`
--
ALTER TABLE `stocks`
  ADD PRIMARY KEY (`stock_id`),
  ADD KEY `fk_stock_item_id` (`item_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email_unique` (`email`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `token_unique` (`token`) USING HASH;

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `cart_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `item_gallery`
--
ALTER TABLE `item_gallery`
  MODIFY `img_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `orderlines`
--
ALTER TABLE `orderlines`
  MODIFY `orderline_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `stocks`
--
ALTER TABLE `stocks`
  MODIFY `stock_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `fk_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `item_category`
--
ALTER TABLE `item_category`
  ADD CONSTRAINT `fk_category_id` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_item_id` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `item_gallery`
--
ALTER TABLE `item_gallery`
  ADD CONSTRAINT `item_gallery_fk` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orderlines`
--
ALTER TABLE `orderlines`
  ADD CONSTRAINT `fk_orderline_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orderline_orders` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `stocks`
--
ALTER TABLE `stocks`
  ADD CONSTRAINT `fk_stock_item_id` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
