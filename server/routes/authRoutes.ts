import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, User } from '../db';
import { generateToken, authenticate, AuthenticatedRequest } from '../middleware/auth';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      res.status(400).json({ error: 'Please provide all required fields.' });
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    const existing = db.users.find(u => u.email.toLowerCase() === emailTrimmed);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const saltRounds = 10;
    const password_hash = bcrypt.hashSync(password, saltRounds);

    const newUser: User = {
      id: db.users.length + 1,
      name: name.trim(),
      email: emailTrimmed,
      password_hash,
      phone: phone.trim(),
      role: 'passenger',
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);

    const token = generateToken(newUser);
    const { password_hash: _, ...safeUser } = newUser;

    res.status(201).json({
      message: 'Account created successfully.',
      user: safeUser,
      token,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter your email and password.' });
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    const user = db.users.find(u => u.email.toLowerCase() === emailTrimmed);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);
    const { password_hash: _, ...safeUser } = user;

    res.json({
      message: 'Login successful.',
      user: safeUser,
      token,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }
  const { password_hash: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});
