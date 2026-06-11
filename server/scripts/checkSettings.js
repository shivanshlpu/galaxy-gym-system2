require('dotenv').config();
const mongoose = require('mongoose');
const SystemSettings = require('./models/SystemSettings.model');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const settings = await SystemSettings.findOne();
  if (!settings) {
    console.log("No settings found");
  } else {
    console.log("Welcome Poster exists:", !!settings.welcomePoster);
    if (settings.welcomePoster) console.log("Welcome Poster length:", settings.welcomePoster.length);
    console.log("Reminder Posters count:", settings.reminderPosters?.length || 0);
  }
  process.exit();
}
check();
