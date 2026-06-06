-- Create Database
CREATE DATABASE IF NOT EXISTS car_showroom;
USE car_showroom;

-- 1. users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. customer_profiles Table
CREATE TABLE IF NOT EXISTS customer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city ENUM('Lahore', 'Islamabad', 'Peshawar', 'Karachi') NOT NULL,
    cnic VARCHAR(15) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    guarantor_name VARCHAR(100) NOT NULL,
    guarantor_phone VARCHAR(20) NOT NULL,
    guarantor_cnic VARCHAR(15) NOT NULL,
    guarantor_bank_name VARCHAR(100) NOT NULL,
    guarantor_account_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. car_categories Table
CREATE TABLE IF NOT EXISTS car_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- 4. cars Table
CREATE TABLE IF NOT EXISTS cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    color VARCHAR(50),
    transmission ENUM('Manual', 'Automatic') DEFAULT 'Automatic',
    fuel_type ENUM('Petrol', 'Diesel', 'Hybrid', 'Electric') DEFAULT 'Petrol',
    engine_capacity VARCHAR(20) NOT NULL,
    mileage INT DEFAULT 0,
    description TEXT,
    image_url VARCHAR(255),
    status ENUM('available', 'booked', 'sold') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES car_categories(id) ON DELETE SET NULL
);

-- 5. bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    car_id INT NOT NULL,
    payment_method ENUM('full_payment', 'installments') NOT NULL,
    delivery_type ENUM('showroom_pickup', 'doorstep_delivery') NOT NULL,
    delivery_charges DECIMAL(10,2) DEFAULT 0.00,
    delivery_address TEXT,
    delivery_city ENUM('Lahore', 'Islamabad', 'Peshawar', 'Karachi'),
    total_price DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'delivered') DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancellation_deadline DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT
);

-- 6. installment_plans Table
CREATE TABLE IF NOT EXISTS installment_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    duration_months INT NOT NULL,
    down_payment DECIMAL(12,2) NOT NULL,
    monthly_installment DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0.00,
    remaining_balance DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 7. payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL,
    payment_type ENUM('down_payment', 'full_payment', 'installment_payment') NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
