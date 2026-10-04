-- ====================================================================
-- SkyBook - Airline Booking System
-- Capstone Project: Object Oriented Software Engineering (BE23CS411)
-- Database: MySQL (All fares and amounts are in Indian Rupees INR ₹)
-- ====================================================================

DROP DATABASE IF EXISTS skybook_db;
CREATE DATABASE skybook_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skybook_db;

-- 1. Users Table (Passengers and Admins)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role ENUM('passenger', 'admin') DEFAULT 'passenger',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Aircraft Table
CREATE TABLE aircraft (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model VARCHAR(50) NOT NULL,
    registration_number VARCHAR(30) NOT NULL UNIQUE,
    total_seats INT NOT NULL DEFAULT 24,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Flights Table (Indian Domestic Routes)
CREATE TABLE flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL UNIQUE,
    aircraft_id INT NOT NULL,
    origin_city VARCHAR(50) NOT NULL,
    origin_code VARCHAR(10) NOT NULL,
    destination_city VARCHAR(50) NOT NULL,
    destination_code VARCHAR(10) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    base_fare_inr INT NOT NULL,
    status ENUM('SCHEDULED', 'BOARDING', 'DEPARTED', 'CANCELLED') DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aircraft_id) REFERENCES aircraft(id) ON DELETE CASCADE
);

-- 4. Seats Table (Rows 1-4, Columns A-F: 24 seats per flight)
-- Concurrency lock attributes: status, locked_by, locked_until
CREATE TABLE seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    seat_class ENUM('ECONOMY', 'PREMIUM') DEFAULT 'ECONOMY',
    price_inr INT NOT NULL,
    status ENUM('AVAILABLE', 'LOCKED', 'BOOKED') DEFAULT 'AVAILABLE',
    locked_by INT NULL,
    locked_until DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_flight_seat (flight_id, seat_number),
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
    FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Bookings Table (Stores passenger details and PNR)
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pnr VARCHAR(10) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    flight_id INT NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    passenger_age INT NOT NULL,
    passenger_gender ENUM('Male', 'Female', 'Other') NOT NULL,
    passenger_phone VARCHAR(20) NOT NULL,
    seat_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    total_amount_inr INT NOT NULL,
    booking_status ENUM('CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE RESTRICT
);

-- 6. Payments Table (Simulated payment records)
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    transaction_id VARCHAR(50) NOT NULL UNIQUE,
    amount_inr INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI / NetBanking',
    payment_status ENUM('SUCCESS', 'FAILED') DEFAULT 'SUCCESS',
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 7. Refunds Table (80% automatic refund on cancellation)
CREATE TABLE refunds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    original_amount_inr INT NOT NULL,
    refund_percentage INT NOT NULL DEFAULT 80,
    refund_amount_inr INT NOT NULL,
    refund_status ENUM('PROCESSED', 'FAILED') DEFAULT 'PROCESSED',
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- ====================================================================
-- SEED DATA
-- ====================================================================

-- Admin user (admin@air.com / admin123)
-- bcrypt hash for 'admin123' with cost 10: $2a$10$wTf7xUe3p18x5H6qU1h2fOslJm27sYmIeU0qR1w.fFkX7xVpE2U4O (standard sample)
INSERT INTO users (id, name, email, password_hash, phone, role) VALUES
(1, 'Admin SkyBook', 'admin@air.com', '$2a$10$tZ2zV9K4cqvXwz0lKvZjK.C5B2p1m0o9n8b7v6c5x4z3a2s1d0f', '+91 98765 00000', 'admin'),
(2, 'Rahul Sharma', 'rahul@example.in', '$2a$10$tZ2zV9K4cqvXwz0lKvZjK.C5B2p1m0o9n8b7v6c5x4z3a2s1d0f', '+91 98401 23456', 'passenger');

-- Aircraft
INSERT INTO aircraft (id, model, registration_number, total_seats) VALUES
(1, 'Airbus A320neo', 'VT-SKB', 24),
(2, 'Boeing 737 MAX 8', 'VT-SKA', 24),
(3, 'Airbus A321neo', 'VT-SKC', 24);

-- Flights (6 Indian domestic routes)
INSERT INTO flights (id, flight_number, aircraft_id, origin_city, origin_code, destination_city, destination_code, departure_time, arrival_time, base_fare_inr, status) VALUES
(1, 'SK-101', 1, 'Chennai', 'MAA', 'Delhi', 'DEL', '2026-10-05 06:30:00', '2026-10-05 09:15:00', 4800, 'SCHEDULED'),
(2, 'SK-102', 1, 'Delhi', 'DEL', 'Mumbai', 'BOM', '2026-10-05 10:45:00', '2026-10-05 13:00:00', 4200, 'SCHEDULED'),
(3, 'SK-201', 2, 'Mumbai', 'BOM', 'Bengaluru', 'BLR', '2026-10-05 14:30:00', '2026-10-05 16:15:00', 3600, 'SCHEDULED'),
(4, 'SK-202', 2, 'Bengaluru', 'BLR', 'Chennai', 'MAA', '2026-10-05 17:45:00', '2026-10-05 18:40:00', 2500, 'SCHEDULED'),
(5, 'SK-301', 3, 'Hyderabad', 'HYD', 'Delhi', 'DEL', '2026-10-06 07:15:00', '2026-10-06 09:40:00', 5200, 'SCHEDULED'),
(6, 'SK-302', 3, 'Kolkata', 'CCU', 'Bengaluru', 'BLR', '2026-10-06 11:30:00', '2026-10-06 14:10:00', 6400, 'SCHEDULED');

-- Generate 24 seats (Rows 1-4, Cols A-F) for all 6 flights
-- Row 1 is Premium Economy (higher legroom, +₹800), Rows 2-4 Economy
-- Flight 1 seats
INSERT INTO seats (flight_id, seat_number, seat_class, price_inr, status) VALUES
(1, '1A', 'PREMIUM', 5600, 'AVAILABLE'), (1, '1B', 'PREMIUM', 5600, 'AVAILABLE'), (1, '1C', 'PREMIUM', 5600, 'AVAILABLE'),
(1, '1D', 'PREMIUM', 5600, 'AVAILABLE'), (1, '1E', 'PREMIUM', 5600, 'AVAILABLE'), (1, '1F', 'PREMIUM', 5600, 'AVAILABLE'),
(1, '2A', 'ECONOMY', 4800, 'AVAILABLE'), (1, '2B', 'ECONOMY', 4800, 'AVAILABLE'), (1, '2C', 'ECONOMY', 4800, 'AVAILABLE'),
(1, '2D', 'ECONOMY', 4800, 'AVAILABLE'), (1, '2E', 'ECONOMY', 4800, 'AVAILABLE'), (1, '2F', 'ECONOMY', 4800, 'AVAILABLE'),
(1, '3A', 'ECONOMY', 4800, 'AVAILABLE'), (1, '3B', 'ECONOMY', 4800, 'AVAILABLE'), (1, '3C', 'ECONOMY', 4800, 'AVAILABLE'),
(1, '3D', 'ECONOMY', 4800, 'AVAILABLE'), (1, '3E', 'ECONOMY', 4800, 'AVAILABLE'), (1, '3F', 'ECONOMY', 4800, 'AVAILABLE'),
(1, '4A', 'ECONOMY', 4800, 'AVAILABLE'), (1, '4B', 'ECONOMY', 4800, 'AVAILABLE'), (1, '4C', 'ECONOMY', 4800, 'AVAILABLE'),
(1, '4D', 'ECONOMY', 4800, 'AVAILABLE'), (1, '4E', 'ECONOMY', 4800, 'AVAILABLE'), (1, '4F', 'ECONOMY', 4800, 'AVAILABLE');

-- Flight 2 seats
INSERT INTO seats (flight_id, seat_number, seat_class, price_inr, status) VALUES
(2, '1A', 'PREMIUM', 5000, 'AVAILABLE'), (2, '1B', 'PREMIUM', 5000, 'AVAILABLE'), (2, '1C', 'PREMIUM', 5000, 'AVAILABLE'),
(2, '1D', 'PREMIUM', 5000, 'AVAILABLE'), (2, '1E', 'PREMIUM', 5000, 'AVAILABLE'), (2, '1F', 'PREMIUM', 5000, 'AVAILABLE'),
(2, '2A', 'ECONOMY', 4200, 'AVAILABLE'), (2, '2B', 'ECONOMY', 4200, 'AVAILABLE'), (2, '2C', 'ECONOMY', 4200, 'AVAILABLE'),
(2, '2D', 'ECONOMY', 4200, 'AVAILABLE'), (2, '2E', 'ECONOMY', 4200, 'AVAILABLE'), (2, '2F', 'ECONOMY', 4200, 'AVAILABLE'),
(2, '3A', 'ECONOMY', 4200, 'AVAILABLE'), (2, '3B', 'ECONOMY', 4200, 'AVAILABLE'), (2, '3C', 'ECONOMY', 4200, 'AVAILABLE'),
(2, '3D', 'ECONOMY', 4200, 'AVAILABLE'), (2, '3E', 'ECONOMY', 4200, 'AVAILABLE'), (2, '3F', 'ECONOMY', 4200, 'AVAILABLE'),
(2, '4A', 'ECONOMY', 4200, 'AVAILABLE'), (2, '4B', 'ECONOMY', 4200, 'AVAILABLE'), (2, '4C', 'ECONOMY', 4200, 'AVAILABLE'),
(2, '4D', 'ECONOMY', 4200, 'AVAILABLE'), (2, '4E', 'ECONOMY', 4200, 'AVAILABLE'), (2, '4F', 'ECONOMY', 4200, 'AVAILABLE');

-- Flight 3 seats
INSERT INTO seats (flight_id, seat_number, seat_class, price_inr, status) VALUES
(3, '1A', 'PREMIUM', 4400, 'AVAILABLE'), (3, '1B', 'PREMIUM', 4400, 'AVAILABLE'), (3, '1C', 'PREMIUM', 4400, 'AVAILABLE'),
(3, '1D', 'PREMIUM', 4400, 'AVAILABLE'), (3, '1E', 'PREMIUM', 4400, 'AVAILABLE'), (3, '1F', 'PREMIUM', 4400, 'AVAILABLE'),
(3, '2A', 'ECONOMY', 3600, 'AVAILABLE'), (3, '2B', 'ECONOMY', 3600, 'AVAILABLE'), (3, '2C', 'ECONOMY', 3600, 'AVAILABLE'),
(3, '2D', 'ECONOMY', 3600, 'AVAILABLE'), (3, '2E', 'ECONOMY', 3600, 'AVAILABLE'), (3, '2F', 'ECONOMY', 3600, 'AVAILABLE'),
(3, '3A', 'ECONOMY', 3600, 'AVAILABLE'), (3, '3B', 'ECONOMY', 3600, 'AVAILABLE'), (3, '3C', 'ECONOMY', 3600, 'AVAILABLE'),
(3, '3D', 'ECONOMY', 3600, 'AVAILABLE'), (3, '3E', 'ECONOMY', 3600, 'AVAILABLE'), (3, '3F', 'ECONOMY', 3600, 'AVAILABLE'),
(3, '4A', 'ECONOMY', 3600, 'AVAILABLE'), (3, '4B', 'ECONOMY', 3600, 'AVAILABLE'), (3, '4C', 'ECONOMY', 3600, 'AVAILABLE'),
(3, '4D', 'ECONOMY', 3600, 'AVAILABLE'), (3, '4E', 'ECONOMY', 3600, 'AVAILABLE'), (3, '4F', 'ECONOMY', 3600, 'AVAILABLE');

-- Flight 4 seats
INSERT INTO seats (flight_id, seat_number, seat_class, price_inr, status) VALUES
(4, '1A', 'PREMIUM', 3300, 'AVAILABLE'), (4, '1B', 'PREMIUM', 3300, 'AVAILABLE'), (4, '1C', 'PREMIUM', 3300, 'AVAILABLE'),
(4, '1D', 'PREMIUM', 3300, 'AVAILABLE'), (4, '1E', 'PREMIUM', 3300, 'AVAILABLE'), (4, '1F', 'PREMIUM', 3300, 'AVAILABLE'),
(4, '2A', 'ECONOMY', 2500, 'AVAILABLE'), (4, '2B', 'ECONOMY', 2500, 'AVAILABLE'), (4, '2C', 'ECONOMY', 2500, 'AVAILABLE'),
(4, '2D', 'ECONOMY', 2500, 'AVAILABLE'), (4, '2E', 'ECONOMY', 2500, 'AVAILABLE'), (4, '2F', 'ECONOMY', 2500, 'AVAILABLE'),
(4, '3A', 'ECONOMY', 2500, 'AVAILABLE'), (4, '3B', 'ECONOMY', 2500, 'AVAILABLE'), (4, '3C', 'ECONOMY', 2500, 'AVAILABLE'),
(4, '3D', 'ECONOMY', 2500, 'AVAILABLE'), (4, '3E', 'ECONOMY', 2500, 'AVAILABLE'), (4, '3F', 'ECONOMY', 2500, 'AVAILABLE'),
(4, '4A', 'ECONOMY', 2500, 'AVAILABLE'), (4, '4B', 'ECONOMY', 2500, 'AVAILABLE'), (4, '4C', 'ECONOMY', 2500, 'AVAILABLE'),
(4, '4D', 'ECONOMY', 2500, 'AVAILABLE'), (4, '4E', 'ECONOMY', 2500, 'AVAILABLE'), (4, '4F', 'ECONOMY', 2500, 'AVAILABLE');

-- Flight 5 seats
INSERT INTO seats (flight_id, seat_number, seat_class, price_inr, status) VALUES
(5, '1A', 'PREMIUM', 6000, 'AVAILABLE'), (5, '1B', 'PREMIUM', 6000, 'AVAILABLE'), (5, '1C', 'PREMIUM', 6000, 'AVAILABLE'),
(5, '1D', 'PREMIUM', 6000, 'AVAILABLE'), (5, '1E', 'PREMIUM', 6000, 'AVAILABLE'), (5, '1F', 'PREMIUM', 6000, 'AVAILABLE'),
(5, '2A', 'ECONOMY', 5200, 'AVAILABLE'), (5, '2B', 'ECONOMY', 5200, 'AVAILABLE'), (5, '2C', 'ECONOMY', 5200, 'AVAILABLE'),
(5, '2D', 'ECONOMY', 5200, 'AVAILABLE'), (5, '2E', 'ECONOMY', 5200, 'AVAILABLE'), (5, '2F', 'ECONOMY', 5200, 'AVAILABLE'),
(5, '3A', 'ECONOMY', 5200, 'AVAILABLE'), (5, '3B', 'ECONOMY', 5200, 'AVAILABLE'), (5, '3C', 'ECONOMY', 5200, 'AVAILABLE'),
(5, '3D', 'ECONOMY', 5200, 'AVAILABLE'), (5, '3E', 'ECONOMY', 5200, 'AVAILABLE'), (5, '3F', 'ECONOMY', 5200, 'AVAILABLE'),
(5, '4A', 'ECONOMY', 5200, 'AVAILABLE'), (5, '4B', 'ECONOMY', 5200, 'AVAILABLE'), (5, '4C', 'ECONOMY', 5200, 'AVAILABLE'),
(5, '4D', 'ECONOMY', 5200, 'AVAILABLE'), (5, '4E', 'ECONOMY', 5200, 'AVAILABLE'), (5, '4F', 'ECONOMY', 5200, 'AVAILABLE');

-- Flight 6 seats
INSERT INTO seats (flight_id, seat_number, seat_class, price_inr, status) VALUES
(6, '1A', 'PREMIUM', 7200, 'AVAILABLE'), (6, '1B', 'PREMIUM', 7200, 'AVAILABLE'), (6, '1C', 'PREMIUM', 7200, 'AVAILABLE'),
(6, '1D', 'PREMIUM', 7200, 'AVAILABLE'), (6, '1E', 'PREMIUM', 7200, 'AVAILABLE'), (6, '1F', 'PREMIUM', 7200, 'AVAILABLE'),
(6, '2A', 'ECONOMY', 6400, 'AVAILABLE'), (6, '2B', 'ECONOMY', 6400, 'AVAILABLE'), (6, '2C', 'ECONOMY', 6400, 'AVAILABLE'),
(6, '2D', 'ECONOMY', 6400, 'AVAILABLE'), (6, '2E', 'ECONOMY', 6400, 'AVAILABLE'), (6, '2F', 'ECONOMY', 6400, 'AVAILABLE'),
(6, '3A', 'ECONOMY', 6400, 'AVAILABLE'), (6, '3B', 'ECONOMY', 6400, 'AVAILABLE'), (6, '3C', 'ECONOMY', 6400, 'AVAILABLE'),
(6, '3D', 'ECONOMY', 6400, 'AVAILABLE'), (6, '3E', 'ECONOMY', 6400, 'AVAILABLE'), (6, '3F', 'ECONOMY', 6400, 'AVAILABLE'),
(6, '4A', 'ECONOMY', 6400, 'AVAILABLE'), (6, '4B', 'ECONOMY', 6400, 'AVAILABLE'), (6, '4C', 'ECONOMY', 6400, 'AVAILABLE'),
(6, '4D', 'ECONOMY', 6400, 'AVAILABLE'), (6, '4E', 'ECONOMY', 6400, 'AVAILABLE'), (6, '4F', 'ECONOMY', 6400, 'AVAILABLE');

-- Seed a sample confirmed booking for Rahul Sharma on Flight 1 (Seat 2A)
UPDATE seats SET status = 'BOOKED' WHERE flight_id = 1 AND seat_number = '2A';
INSERT INTO bookings (id, pnr, user_id, flight_id, passenger_name, passenger_age, passenger_gender, passenger_phone, seat_id, seat_number, total_amount_inr, booking_status)
VALUES (1, 'SKB9X2M4', 2, 1, 'Rahul Sharma', 28, 'Male', '+91 98401 23456', 7, '2A', 4800, 'CONFIRMED');

INSERT INTO payments (id, booking_id, transaction_id, amount_inr, payment_method, payment_status)
VALUES (1, 1, 'TXN-98401234-SKB', 4800, 'UPI (BHIM / GPay)', 'SUCCESS');
