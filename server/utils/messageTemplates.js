const templates = {
  welcome: ({ member }) =>
    `Hello ${member.fullName}! 🏋️\n\nWelcome to our gym! Your membership starts today.\n\nWe're excited to have you on board.\n\nThank you! 💪`,

  expiry: ({ member, daysLeft }) =>
    `Hello ${member.fullName},\n\nYour Galaxy Fitness Club gym membership will expire in *${daysLeft} day${daysLeft > 1 ? 's' : ''}*.\n\nPlease renew your membership to continue training without interruption.\n\nThank you! 🙏`,

  expired: ({ member, activePlans }) => {
    let plansText = '';
    if (activePlans && activePlans.length > 0) {
      plansText = '\n\n*Available Renewal Plans:*\n' + activePlans.map(p => `👉 ${p.name}: ₹${p.price} for ${p.durationDays} days`).join('\n');
    }
    return `Hello ${member.fullName},\n\nYour GymOS fitness membership has officially *expired* today.\n\nWe would love to see you back at the gym. To resume your fitness journey, please renew your membership at your earliest convenience.${plansText}\n\nReach out to us if you need any assistance!\n\nBest Regards,\nTeam GymOS 💪`;
  },

  inactive: ({ member, absentDays }) =>
    `Hey ${member.fullName}! 🚨 Alert: Your muscles are filing a missing persons report! 🕵️‍♂️\n\nYou haven't been to Galaxy Fitness Club in *${absentDays} days*! Don't let your gains turn into losses. Get off the couch, grab your gym gear, and let's crush some goals today! 💪🔥 See you at the gym!`,

  payment_reminder: ({ member }) =>
    `Hello ${member.fullName},\n\nThis is a friendly reminder that your payment is pending.\n\nPlease make the payment at your earliest convenience.\n\nThank you! 🙏`,
};

const getTemplate = (type, data) => {
  const templateFn = templates[type];
  if (!templateFn) {
    throw new Error(`Unknown message template type: ${type}`);
  }
  return templateFn(data);
};

module.exports = { templates, getTemplate };
