const db = require('../config/database');
const logger = require('../utils/logger');
const mockStorage = require('../utils/mockStorage');

// Check if we're in mock mode
const isMockMode = () => {
  // For development, always use mock mode since database is not available
  return true;
};

class User {
  // Create user table if it doesn't exist
  static async createTable() {
    try {
      if (isMockMode()) {
        console.log('Mock database mode - skipping table creation');
        return;
      }

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          preferences JSONB DEFAULT '{}',
          subscription JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      `;

      await db.query(createTableQuery);
      logger.info('Users table created/verified successfully');
    } catch (error) {
      logger.error('Failed to create users table', error);
      throw error;
    }
  }

  // Create a new user
  static async create(userData) {
    const { email, password, name, role = 'user' } = userData;

    try {
      if (isMockMode()) {
        console.log('📝 Creating mock user:', { email, name, role });
        
        const user = mockStorage.createUser({ email, password, name, role });
        
        if (!user) {
          console.log('❌ User already exists:', email);
          return {
            success: false,
            error: 'Email already exists',
            message: 'A user with this email already exists'
          };
        }

        console.log('✅ Mock user created successfully:', { email, id: user.id });
        console.log('🔍 Mock storage status:', mockStorage.getStatus());

        return {
          success: true,
          data: { ...user, password: undefined },
          message: 'User created successfully'
        };
      }

      // Real database implementation would go here
      // For now, return mock success
      return {
        success: true,
        data: {
          id: Date.now(),
          email,
          name,
          role,
          preferences: {},
          subscription: { plan: 'free', features: [] },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        message: 'User created successfully'
      };
    } catch (error) {
      logger.error('Failed to create user', { error: error.message, email });
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      if (isMockMode()) {
        console.log('🔍 Looking for mock user:', email);
        const user = mockStorage.findUserByEmail(email);
        console.log('Found user:', user ? { id: user.id, email: user.email, name: user.name } : 'null');
        return user || null;
      }

      // Real database implementation would go here
      return null;
    } catch (error) {
      logger.error('Failed to find user by email', { error: error.message, email });
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      if (isMockMode()) {
        return mockStorage.findUserById(id);
      }

      // Real database implementation would go here
      return null;
    } catch (error) {
      logger.error('Failed to find user by ID', { error: error.message, id });
      throw error;
    }
  }

  // Authenticate user
  static async authenticate(email, password) {
    try {
      console.log('🔐 Attempting authentication for:', email);
      const user = await this.findByEmail(email);
      
      if (!user) {
        console.log('❌ User not found:', email);
        return {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        };
      }

      console.log('👤 User found, checking password...');
      console.log('Stored password:', user.password);
      console.log('Input password:', password);
      console.log('Password match:', user.password === password);

      // Check password (in mock mode, compare plain text)
      if (user.password !== password) {
        logger.warn('Failed login attempt', { email });
        return {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        };
      }

      // Update last login
      await this.updateLastLogin(user.id);

      // Generate mock JWT token
      const token = `mock-jwt-${Date.now()}-${user.id}`;

      // Remove password from response
      const { password: _, ...userData } = user;

      logger.info('User authenticated successfully', { email, role: user.role });

      return {
        success: true,
        data: {
          user: userData,
          token
        },
        message: 'Authentication successful'
      };
    } catch (error) {
      logger.error('Authentication failed', { error: error.message, email });
      throw error;
    }
  }

  // Update last login timestamp
  static async updateLastLogin(userId) {
    try {
      if (isMockMode()) {
        mockStorage.updateUserLastLogin(userId);
        return;
      }

      // Real database implementation would go here
    } catch (error) {
      logger.error('Failed to update last login', { error: error.message, userId });
      // Don't throw error for this operation
    }
  }

  // Update user preferences
  static async updatePreferences(userId, preferences) {
    try {
      if (isMockMode()) {
        const user = mockStorage.updateUserPreferences(userId, preferences);
        
        if (user) {
          logger.info('Mock user preferences updated', { userId });
          return {
            success: true,
            data: { ...user, password: undefined },
            message: 'Preferences updated successfully'
          };
        }
        
        return {
          success: false,
          error: 'User not found',
          message: 'User not found'
        };
      }

      // Real database implementation would go here
      return {
        success: false,
        error: 'Database not available',
        message: 'Database not available'
      };
    } catch (error) {
      logger.error('Failed to update user preferences', { error: error.message, userId });
      throw error;
    }
  }

  // Update user subscription
  static async updateSubscription(userId, subscription) {
    try {
      if (isMockMode()) {
        const user = mockStorage.updateUserSubscription(userId, subscription);
        
        if (user) {
          logger.info('Mock user subscription updated', { userId, plan: subscription.plan });
          return {
            success: true,
            data: { ...user, password: undefined },
            message: 'Subscription updated successfully'
          };
        }
        
        return {
          success: false,
          error: 'User not found',
          message: 'User not found'
        };
      }

      // Real database implementation would go here
      return {
        success: false,
        error: 'Database not available',
        message: 'Database not available'
      };
    } catch (error) {
      logger.error('Failed to update user subscription', { error: error.message, userId });
      throw error;
    }
  }

  // Deactivate user
  static async deactivate(userId) {
    try {
      if (isMockMode()) {
        const user = mockStorage.deactivateUser(userId);
        
        if (user) {
          logger.info('Mock user deactivated', { userId });
          return {
            success: true,
            data: { ...user, password: undefined },
            message: 'User deactivated successfully'
          };
        }
        
        return {
          success: false,
          error: 'User not found',
          message: 'User not found'
        };
      }

      // Real database implementation would go here
      return {
        success: false,
        error: 'Database not available',
        message: 'Database not available'
      };
    } catch (error) {
      logger.error('Failed to deactivate user', { error: error.message, userId });
      throw error;
    }
  }

  // Get all users (admin only)
  static async findAll(limit = 100, offset = 0) {
    try {
      if (isMockMode()) {
        const result = mockStorage.getAllUsers(limit, offset);
        
        return {
          success: true,
          data: result.users,
          count: result.count
        };
      }

      // Real database implementation would go here
      return {
        success: false,
        error: 'Database not available',
        message: 'Database not available'
      };
    } catch (error) {
      logger.error('Failed to fetch users', { error: error.message });
      throw error;
    }
  }
}

module.exports = User;
