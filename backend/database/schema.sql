CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- ==========================================
-- 1. CORE ENTITIES (Users, Doctors, Patients)
-- ==========================================kkkkkk

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'receptionist', 'pharmacist', 'patient') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    specialization VARCHAR(255),
    phone VARCHAR(20),
    department VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    dob DATE,
    gender ENUM('Male', 'Female', 'Other'),
    address TEXT,
    mrn VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 2. CLINICAL WORKFLOW (Appointments & Visits)
-- ==========================================

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    doctor_id INT,
    appointment_date DATETIME,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT,
    visit_date DATE NOT NULL,
    queue_number INT NOT NULL,
    priority ENUM('normal', 'urgent', 'emergency') DEFAULT 'normal',
    status ENUM('waiting', 'examining', 'testing', 'completed', 'admitted') DEFAULT 'waiting',
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- 3. BED MANAGEMENT (Rooms & Beds)
-- ==========================================

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department VARCHAR(100),
    room_number VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('ICU','General','Private','Operating') DEFAULT 'General',
    status ENUM('available','full','maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    bed_number VARCHAR(20) NOT NULL,
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    patient_id INT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

-- ==========================================
-- 4. LAB & PRESCRIPTIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS lab_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    test_type VARCHAR(255) NOT NULL,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    results_details TEXT,
    results_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NULL,
    visit_id INT NULL,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    notes TEXT,
    status ENUM('pending', 'dispensed') DEFAULT 'pending',
    medications_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. AUDIT LOGGING
-- ==========================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- 6. INVENTORY & PHARMACY (Inventory, Invoices)
-- ==========================================

CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category ENUM('medicine', 'equipment', 'supply') DEFAULT 'medicine',
    quantity INT DEFAULT 0,
    unit VARCHAR(50),
    unit_price DECIMAL(10, 2),
    low_stock_threshold INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NULL,
    visit_id INT NULL,
    patient_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('paid', 'unpaid', 'cancelled') DEFAULT 'unpaid',
    items JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ==========================================
-- 7. MEDICAL RECORDS (EMR)
-- ==========================================

CREATE TABLE IF NOT EXISTS medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    appointment_id INT,
    doctor_id INT,
    primary_diagnosis TEXT NOT NULL,
    treatment_plan TEXT,
    visit_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
);

-- ==========================================
-- 8. DOCTOR SCHEDULES
-- ==========================================

CREATE TABLE IF NOT EXISTS doctor_shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    shift_date DATE NOT NULL,
    shift_type ENUM('morning', 'afternoon', 'night') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- END OF SCHEMA
-- ==========================================
