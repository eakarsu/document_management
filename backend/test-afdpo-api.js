const jwt = require('jsonwebtoken');

// Create AFDPO token
const payload = {
  userId: 'cmfmkf4k7001ifwf7mybytq5c',
  email: 'afdpo.publisher@airforce.mil',
  roleId: 'cmfjy7ur60005neoq12fsj8dl',
  organizationId: 'cmfmkdk9m00008e6fegn6zjk',
  type: 'access'
};

const token = jwt.sign(payload, 'your-secret-key', { expiresIn: '1h' });
console.log('AFDPO Token:', token);

// Test API call
const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:4000/api/documents', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('\nAPI Response Status:', response.status);
    console.log('Documents returned:', data.length || 'Error');

    if (Array.isArray(data)) {
      data.forEach(doc => {
        console.log(`  📄 ${doc.title} (${doc.id})`);
      });
    } else {
      console.log('Response data:', data);
    }
  } catch (error) {
    console.error('API Error:', error.message);
  }
}

testAPI();