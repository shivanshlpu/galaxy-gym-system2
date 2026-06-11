const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://gym-backend-xxxx.onrender.com/api/v1/members', {
      fullName: 'Test',
      phone: '9999999999',
      joiningDate: new Date(),
      paymentMethod: 'Online'
    });
    console.log(res.data);
  } catch (err) {
    console.log(err.response?.data || err.message);
  }
}

test();
