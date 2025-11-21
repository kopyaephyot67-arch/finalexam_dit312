-- Create products table
CREATE TABLE IF NOT EXISTS `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock` int(11) DEFAULT 0,
  `imageUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert seed data (5 shop products)
INSERT INTO `products` (`id`, `name`, `slug`, `description`, `price`, `category`, `stock`, `imageUrl`) VALUES
(1, 'MacBook Pro 16"', 'macbook-pro-16', 'Apple M3 Max chip, 36GB RAM, 1TB SSD. Perfect for developers and creative professionals.', 2499.99, 'Electronics', 15, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'),
(2, 'Sony WH-1000XM5', 'sony-wh1000xm5', 'Industry-leading noise canceling wireless headphones with premium sound quality.', 399.99, 'Electronics', 30, 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400'),
(3, 'iPhone 15 Pro', 'iphone-15-pro', 'Titanium design, A17 Pro chip, advanced camera system with 5x telephoto.', 999.99, 'Electronics', 25, 'https://images.unsplash.com/photo-1592286927505-25f428e27100?w=400'),
(4, 'Herman Miller Aeron Chair', 'herman-miller-aeron', 'Ergonomic office chair with PostureFit support and adjustable features.', 1395.00, 'Furniture', 8, 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400'),
(5, 'LG UltraWide Monitor 34"', 'lg-ultrawide-34', '34-inch curved WQHD display with HDR10 support and USB-C connectivity.', 599.99, 'Electronics', 12, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400');