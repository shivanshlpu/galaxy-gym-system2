const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { checkInactiveMembers } = require('../services/inactivityChecker');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    
    console.log('Running checkInactiveMembers manually...');
    await checkInactiveMembers();
    console.log('Finished checkInactiveMembers.');
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
    mongoose.connection.close();
  });
