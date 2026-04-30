-- ============================================================
--  Schema Definition — BharatBazzar Handcraft & Artisan Store
-- ============================================================

CREATE DATABASE IF NOT EXISTS shopdb;
USE shopdb;

-- --------------------------------------------------------
-- Users Table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- Addresses Table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Addresses (
  address_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  label VARCHAR(50) DEFAULT 'Home',
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Categories Table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id INT NULL,
  FOREIGN KEY (parent_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- Products Table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  brand VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- Inventory Table (3NF Normalization)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Inventory (
  product_id INT PRIMARY KEY,
  quantity INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Cart Table (1 active cart per user)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Cart (
  cart_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Cart_Items Table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Cart_Items (
  cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  UNIQUE(cart_id, product_id),
  FOREIGN KEY (cart_id) REFERENCES Cart(cart_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Orders Table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  address_id INT,
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id),
  FOREIGN KEY (address_id) REFERENCES Addresses(address_id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- Order_Items Table (Price Snapshot)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Order_Items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- --------------------------------------------------------
-- Payments Table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  method VARCHAR(50) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  transaction_ref VARCHAR(255),
  provider VARCHAR(100),
  paid_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Reviews Table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  body TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id),
  FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Coupons Table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Coupons (
  coupon_id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type ENUM('percent', 'flat') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amt DECIMAL(10, 2) DEFAULT 0.00,
  max_uses INT DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- --------------------------------------------------------
-- Wishlist (Optional Many-to-Many Table)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS Wishlist (
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW vw_top_products AS
SELECT p.product_id, p.name, SUM(oi.quantity) as total_sold
FROM Products p
JOIN Order_Items oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.name
ORDER BY total_sold DESC;

CREATE OR REPLACE VIEW vw_user_summary AS
SELECT u.user_id, u.name, u.email,
       COUNT(o.order_id) as total_orders,
       COALESCE(SUM(o.total_amount), 0) as total_spent
FROM Users u
LEFT JOIN Orders o ON u.user_id = o.user_id
GROUP BY u.user_id, u.name, u.email;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER //

CREATE PROCEDURE PlaceOrder(
    IN p_user_id INT,
    IN p_address_id INT,
    IN p_coupon_code VARCHAR(50),
    OUT p_order_id INT,
    OUT p_msg VARCHAR(255)
)
BEGIN
    DECLARE v_cart_id INT;
    DECLARE v_subtotal DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_discount DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_total DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_coupon_type ENUM('percent', 'flat');
    DECLARE v_coupon_value DECIMAL(10,2);
    DECLARE v_coupon_min DECIMAL(10,2);
    
    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
        SET p_order_id = 0;
        SET p_msg = 'Error occurred during order placement';
    END;

    START TRANSACTION;

    SELECT cart_id INTO v_cart_id FROM Cart WHERE user_id = p_user_id;

    IF v_cart_id IS NULL THEN
        SET p_order_id = 0;
        SET p_msg = 'Cart not found';
        ROLLBACK;
    ELSE
        SELECT COALESCE(SUM(ci.quantity * p.price), 0.00) INTO v_subtotal
        FROM Cart_Items ci
        JOIN Products p ON ci.product_id = p.product_id
        WHERE ci.cart_id = v_cart_id;

        IF v_subtotal = 0 THEN
            SET p_order_id = 0;
            SET p_msg = 'Cart is empty';
            ROLLBACK;
        ELSE
            -- Coupon Logic
            IF p_coupon_code != '' THEN
                SELECT discount_type, discount_value, min_order_amt 
                INTO v_coupon_type, v_coupon_value, v_coupon_min
                FROM Coupons 
                WHERE code = p_coupon_code AND is_active = 1;
                
                IF v_coupon_type IS NOT NULL AND v_subtotal >= v_coupon_min THEN
                    IF v_coupon_type = 'percent' THEN
                        SET v_discount = v_subtotal * (v_coupon_value / 100);
                    ELSE
                        SET v_discount = v_coupon_value;
                    END IF;
                END IF;
            END IF;

            SET v_total = v_subtotal - v_discount;
            IF v_total < 0 THEN SET v_total = 0; END IF;

            INSERT INTO Orders (user_id, address_id, status, subtotal, discount, total_amount)
            VALUES (p_user_id, p_address_id, 'pending', v_subtotal, v_discount, v_total);
            
            SET p_order_id = LAST_INSERT_ID();

            INSERT INTO Order_Items (order_id, product_id, quantity, unit_price)
            SELECT p_order_id, ci.product_id, ci.quantity, p.price
            FROM Cart_Items ci
            JOIN Products p ON ci.product_id = p.product_id
            WHERE ci.cart_id = v_cart_id;

            -- Trigger handles inventory deduction.
            DELETE FROM Cart_Items WHERE cart_id = v_cart_id;

            SET p_msg = 'Order placed successfully';
            COMMIT;
        END IF;
    END IF;
END //

CREATE PROCEDURE ProcessPayment(
    IN p_order_id INT,
    IN p_method VARCHAR(50),
    IN p_provider VARCHAR(100),
    OUT p_pay_id INT,
    OUT p_msg VARCHAR(255)
)
BEGIN
    DECLARE v_tx_ref VARCHAR(255);
    
    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
        SET p_pay_id = 0;
        SET p_msg = 'Error occurred during payment processing';
    END;

    START TRANSACTION;
    
    SET v_tx_ref = CONCAT('TXN-', UUID());
    
    INSERT INTO Payments (order_id, method, status, transaction_ref, provider, paid_at)
    VALUES (p_order_id, p_method, 'completed', v_tx_ref, p_provider, CURRENT_TIMESTAMP);
    
    SET p_pay_id = LAST_INSERT_ID();
    
    UPDATE Orders SET status = 'confirmed' WHERE order_id = p_order_id;
    
    SET p_msg = 'Payment successful';
    COMMIT;
END //

DELIMITER ;

-- ============================================================
-- TRIGGERS
-- ============================================================

DELIMITER //

CREATE TRIGGER AfterOrderItemsInsert
AFTER INSERT ON Order_Items
FOR EACH ROW
BEGIN
    UPDATE Inventory
    SET quantity = quantity - NEW.quantity
    WHERE product_id = NEW.product_id;
END //

CREATE TRIGGER BeforeOrderItemsInsert
BEFORE INSERT ON Order_Items
FOR EACH ROW
BEGIN
    DECLARE v_stock INT;
    SELECT quantity INTO v_stock FROM Inventory WHERE product_id = NEW.product_id;
    
    IF v_stock < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock for product';
    END IF;
END //

CREATE TRIGGER AfterPaymentComplete
AFTER UPDATE ON Payments
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE Orders SET status = 'confirmed' WHERE order_id = NEW.order_id;
    END IF;
END //

DELIMITER ;
