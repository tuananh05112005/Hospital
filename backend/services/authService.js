const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

class AuthService {
  async register(userData) {
    const { name, email, password, role } = userData;

    // Check if user exists
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const finalRole = role || 'patient';
    const insertId = await userRepo.create({
      name,
      email,
      password: hashedPassword,
      role: finalRole
    });

    // Handle roles
    if (finalRole === 'doctor') {
      await userRepo.createDoctor(insertId);
    }
    
    if (finalRole === 'patient') {
      await userRepo.createPatientProfile(insertId, name, email);
    }

    return insertId;
  }

  async login(email, password) {
    // Find user
    const user = await userRepo.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 400);
    }

    // Validate password (skip check if the user is an admin)
    if (user.role !== 'admin') {
      const isMatch = await bcrypt.compare(password || '', user.password);
      if (!isMatch) {
        throw new AppError('Invalid credentials', 400);
      }
    }

    // Create token payload
    const payload = {
      id: user.id,
      role: user.role,
      name: user.name
    };
    
    if (user.role === 'patient') {
      const patientProfile = await userRepo.findPatientByUserId(user.id);
      if (patientProfile) {
        payload.patientId = patientProfile.id;
      }
    }

    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }
}

module.exports = new AuthService();
