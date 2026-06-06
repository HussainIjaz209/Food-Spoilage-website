USE car_showroom;

-- Clear existing data (in reverse order of dependencies)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE installment_plans;
TRUNCATE TABLE bookings;
TRUNCATE TABLE cars;
TRUNCATE TABLE car_categories;
TRUNCATE TABLE customer_profiles;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Categories
INSERT INTO car_categories (id, name, description) VALUES
(1, 'Sedan', 'Comfortable 4-door passenger cars, ideal for daily commutes and family trips.'),
(2, 'SUV', 'Sport Utility Vehicles with higher ground clearance, spacious cabins, and off-road capability.'),
(3, 'Hatchback', 'Compact and fuel-efficient vehicles with a rear door that swings upward.'),
(4, 'Electric', 'Eco-friendly, battery-powered electric vehicles with advanced smart systems.'),
(5, 'Luxury', 'Premium vehicles featuring high-end comfort, performance, and cutting-edge technology.');

-- 2. Insert Users
-- Passwords are encrypted using bcrypt for 'password123'
-- Hash: $2a$10$5pQG4j9mZ8E9H09U4.Qy8OzP0.hJ3o32J3d6r7y6g6V3B9I2NlX9q
INSERT INTO users (id, username, email, password, role) VALUES
(1, 'admin', 'admin@carshowroom.com', '$2a$10$.i0jgKbcOL54ZNXShgVtMeTdY0v07RQiXC5NpKCNhLC7FXDhkYiCm', 'admin'),
(2, 'zaidkhan', 'zaid.khan@gmail.com', '$2a$10$.i0jgKbcOL54ZNXShgVtMeTdY0v07RQiXC5NpKCNhLC7FXDhkYiCm', 'customer'),
(3, 'aliahsan', 'ali.ahsan@yahoo.com', '$2a$10$.i0jgKbcOL54ZNXShgVtMeTdY0v07RQiXC5NpKCNhLC7FXDhkYiCm', 'customer');

-- 3. Insert Customer Profiles (Lahore, Karachi)
INSERT INTO customer_profiles (
    id, user_id, full_name, phone, address, city, cnic, bank_name, account_number,
    guarantor_name, guarantor_phone, guarantor_cnic, guarantor_bank_name, guarantor_account_number
) VALUES
(
    1, 2, 'MUHAMMAD ZAID KHAN', '0300-1234567', 'House 45, Block H-3, Johar Town', 'Lahore', '35202-1234567-9', 'Meezan Bank', '0203-0102030405',
    'Tariq Khan', '0321-9876543', '35202-9876543-1', 'Habib Bank Limited', '0010-0987654321'
),
(
    2, 3, 'Ali Ahsan', '0333-7654321', 'Apartment 4B, Ocean Heights, Clifton', 'Karachi', '42201-9876543-2', 'Bank Alfalah', '1004-9876543210',
    'Kamran Ahsan', '0345-1234567', '42201-1234567-3', 'Standard Chartered', '0112-2233445566'
);

-- 4. Insert Cars (with realistic pricing in PKR)
INSERT INTO cars (id, category_id, brand, model, year, price, color, transmission, fuel_type, engine_capacity, mileage, description, image_url, status) VALUES
(1, 1, 'Honda', 'Civic Oriel 1.5L Turbo', 2024, 8500000.00, 'Taffeta White', 'Automatic', 'Petrol', '1500cc', 12000, 'Excellent condition Civic Oriel, single-owner, fully maintained by dealership.', '/uploads/honda_civic.jpg', 'available'),
(2, 1, 'Toyota', 'Corolla Altis Grande 1.8L', 2023, 7500000.00, 'Attitude Black', 'Automatic', 'Petrol', '1800cc', 24000, 'Top-of-the-line Grande, leather seats, sunroof, clean interior.', '/uploads/toyota_corolla.jpg', 'available'),
(3, 2, 'Kia', 'Sportage AWD', 2024, 8700000.00, 'Mercury Gray', 'Automatic', 'Petrol', '2000cc', 8500, 'Panoramic sunroof AWD model, spotless bumper-to-bumper original body.', '/uploads/kia_sportage.jpg', 'available'),
(4, 2, 'Hyundai', 'Tucson AWD', 2023, 8300000.00, 'Silver Metallic', 'Automatic', 'Petrol', '2000cc', 15000, 'Hyundai Tucson AWD, smart entry, wireless charging, pristine engine condition.', '/uploads/hyundai_tucson.jpg', 'available'),
(5, 3, 'Suzuki', 'Swift GLX CV', 2023, 4800000.00, 'Phoenix Red', 'Automatic', 'Petrol', '1200cc', 18000, 'Highly fuel-efficient premium hatchback with DRLs and push start.', '/uploads/suzuki_swift.jpg', 'available'),
(6, 4, 'Tesla', 'Model 3 Long Range', 2022, 16000000.00, 'Solid Black', 'Automatic', 'Electric', 'Dual Motor', 32000, 'Full Self-Driving capability package, long range battery, imported from UK.', '/uploads/tesla_model3.jpg', 'available'),
(7, 5, 'Audi', 'e-tron GT', 2023, 38000000.00, 'Daytona Gray', 'Automatic', 'Electric', 'Quattro', 5000, 'Ultimate luxury electric sports sedan. Fully loaded, GCC specs.', '/uploads/audi_etron.jpg', 'available');

-- 5. Insert Sample Bookings
-- Booking 1: Customer Zaid Khan books Honda Civic (ID 1) with Full Payment & Doorstep Delivery (Lahore)
-- Delivery Charges: 15,000. Total Price: 8,515,000.
-- Cancellation deadline: 24 hours after booking (we set a fixed future/past datetime, but in app logic, it's dynamic)
INSERT INTO bookings (id, customer_id, car_id, payment_method, delivery_type, delivery_charges, delivery_address, delivery_city, total_price, status, booking_date, cancellation_deadline) VALUES
(1, 2, 1, 'full_payment', 'doorstep_delivery', 15000.00, 'House 45, Block H-3, Johar Town', 'Lahore', 8515000.00, 'confirmed', '2026-06-03 10:00:00', '2026-06-04 10:00:00');

-- Mark the booked car as 'booked'
UPDATE cars SET status = 'booked' WHERE id = 1;

-- Payment for Booking 1 (Full Payment)
INSERT INTO payments (id, booking_id, amount, payment_date, payment_method, payment_type, transaction_id, status) VALUES
(1, 1, 8515000.00, '2026-06-03 10:15:00', 'Bank Transfer', 'full_payment', 'TXN_CIVIC_FULL_98234', 'success');


-- Booking 2: Customer Ali Ahsan books Kia Sportage (ID 3) on Installments & Showroom Pickup
-- Total Price: 8,700,000.
INSERT INTO bookings (id, customer_id, car_id, payment_method, delivery_type, delivery_charges, delivery_address, delivery_city, total_price, status, booking_date, cancellation_deadline) VALUES
(2, 3, 3, 'installments', 'showroom_pickup', 0.00, NULL, NULL, 8700000.00, 'pending', '2026-06-03 11:30:00', '2026-06-04 11:30:00');

-- Mark the booked car as 'booked'
UPDATE cars SET status = 'booked' WHERE id = 3;

-- Installment Plan for Booking 2: 24 months, 20% down payment (1,740,000), remaining (6,960,000) divided over 24 months = 290,000 per month
INSERT INTO installment_plans (id, booking_id, duration_months, down_payment, monthly_installment, interest_rate, remaining_balance) VALUES
(1, 2, 24, 1740000.00, 290000.00, 0.00, 6960000.00);

-- Down Payment transaction for Booking 2
INSERT INTO payments (id, booking_id, amount, payment_date, payment_method, payment_type, transaction_id, status) VALUES
(2, 2, 1740000.00, '2026-06-03 11:45:00', 'Bank Transfer', 'down_payment', 'TXN_SPORTAGE_DOWN_74312', 'success');
