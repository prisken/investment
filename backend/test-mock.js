// Test script for mock storage
const mockStorage = require('./utils/mockStorage');

console.log('🧪 Testing mock storage...');

// Test user creation
console.log('\n1. Creating test user...');
const user = mockStorage.createUser({
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  role: 'user'
});

console.log('Created user:', user);

// Test user retrieval
console.log('\n2. Finding user by email...');
const foundUser = mockStorage.findUserByEmail('test@example.com');
console.log('Found user:', foundUser);

// Test password comparison
console.log('\n3. Testing password comparison...');
console.log('Stored password:', foundUser.password);
console.log('Input password:', 'password123');
console.log('Password match:', foundUser.password === 'password123');

// Test storage status
console.log('\n4. Storage status:');
console.log(mockStorage.getStatus());

console.log('\n✅ Mock storage test completed!');

