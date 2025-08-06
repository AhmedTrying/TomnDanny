// Script to create a kitchen user for Tomm&Danny café system
// Run this script with: node scripts/create-kitchen-user.js

const createKitchenUser = async () => {
  const userData = {
    email: 'kitchen@tommdanny.com',
    password: 'kitchen123',
    full_name: 'Kitchen Staff',
    role: 'kitchen',
    is_active: true
  };

  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Kitchen user created successfully!');
      console.log('Email: kitchen@tommdanny.com');
      console.log('Password: kitchen123');
      console.log('Role: kitchen');
    } else {
      console.error('❌ Error creating kitchen user:', result.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('Make sure your development server is running on http://localhost:3000');
  }
};

createKitchenUser(); 