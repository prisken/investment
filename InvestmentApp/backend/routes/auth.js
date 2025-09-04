const express = require('express');
const router = express.Router();

// In-memory storage for demo purposes
// In production, this would be replaced with a database and proper authentication
let users = {
  'demo@example.com': {
    id: 'demo-user',
    email: 'demo@example.com',
    name: 'Demo User',
    password: 'demo123', // In production, this would be hashed
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  }
};

// POST /api/auth/register - User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, name'
      });
    }

    // Check if user already exists
    if (users[email]) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      name,
      password, // In production, hash this password
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    users[email] = newUser;

    // Return user data (without password)
    const { password: _, ...userData } = newUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: userData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password'
      });
    }

    // Check if user exists
    const user = users[email];
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password (in production, compare hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate mock JWT token (in production, use proper JWT)
    const token = `mock-jwt-${Date.now()}-${user.id}`;

    // Return user data and token (without password)
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token,
        expiresIn: '24h'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log in'
    });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', async (req, res) => {
  try {
    // In production, you might want to blacklist the token
    // For now, just return success
    
    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging out user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log out'
    });
  }
});

// GET /api/auth/profile - Get user profile
router.get('/profile', async (req, res) => {
  try {
    // In production, this would verify the JWT token
    // For demo, we'll use a mock user ID from headers
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    // Find user by ID
    const user = Object.values(users).find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return user data (without password)
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      data: userData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    if (!name && !email) {
      return res.status(400).json({
        success: false,
        error: 'At least one field to update is required: name, email'
      });
    }

    // Find user by ID
    const user = Object.values(users).find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user data
    if (name) user.name = name;
    if (email && email !== user.email) {
      // Check if new email is already taken
      if (users[email] && users[email].id !== userId) {
        return res.status(409).json({
          success: false,
          error: 'Email already taken'
        });
      }
      
      // Update email (in production, you'd need to handle this more carefully)
      delete users[user.email];
      user.email = email;
      users[email] = user;
    }

    // Return updated user data (without password)
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

// POST /api/auth/change-password - Change user password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: currentPassword, newPassword'
      });
    }

    // Find user by ID
    const user = Object.values(users).find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    if (user.password !== currentPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password (in production, hash the new password)
    user.password = newPassword;

    res.json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// GET /api/auth/verify - Verify authentication token
router.get('/verify', async (req, res) => {
  try {
    // In production, this would verify the JWT token
    // For demo, we'll just return success
    
    res.json({
      success: true,
      message: 'Token is valid',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify token'
    });
  }
});

module.exports = router;
