const templates = {
  welcome: ({ member, startDate, endDate, planName, amount }) =>
    `Welcome to Galaxy Fitness Club, ${member.fullName}! 🏋️‍♂️\n\nYour membership has been activated.\nJoining Date: ${startDate}\nEnding Date: ${endDate}\n\n*Invoice Details:*\n- Plan: ${planName}\n*Total Paid: ₹${amount}*\n\nLet's get those gains! 💪`,

  welcome_pending: ({ member, planName, amount }) =>
    `Welcome to Galaxy Fitness Club, ${member.fullName}! 🏋️‍♂️\n\nYour registration is complete, but your payment is currently *PENDING*.\n\n*Invoice Details:*\n- Plan: ${planName}\n*Total Due: ₹${amount}*\n\nPlease clear your pending dues at the reception to officially activate your plan. Thank you!`,

  payment_cleared: ({ member, amount, endDate }) =>
    `Thank you, ${member.fullName}! 🎉\n\nWe have received your payment of ₹${amount}. Your pending dues are now completely cleared and your membership is fully active until ${endDate}.\n\nLet's crush those goals! 💪`,

  expiry: ({ member, daysLeft }) =>
    `Hello ${member.fullName},\n\nYour Galaxy Fitness Club gym membership will expire in *${daysLeft} day${daysLeft > 1 ? 's' : ''}*.\n\nPlease renew your membership to continue training without interruption.\n\nThank you! 🙏`,

  expired: ({ member, activePlans }) => {
    let plansText = '';
    if (activePlans && activePlans.length > 0) {
      plansText = '\n\n*Available Renewal Plans:*\n' + activePlans.map(p => `👉 ${p.name}: ₹${p.price} for ${p.durationDays} days`).join('\n');
    }
    return `Hello ${member.fullName},\n\nYour GymOS fitness membership has officially *expired* today.\n\nWe would love to see you back at the gym. To resume your fitness journey, please renew your membership at your earliest convenience.${plansText}\n\nReach out to us if you need any assistance!\n\nBest Regards,\nTeam GymOS 💪`;
  },

  renewal: ({ member, planName }) =>
    `Welcome back, ${member.fullName}! 🎉\n\nYour membership has been successfully renewed with the *${planName}* plan. We are thrilled to see you back at Galaxy Fitness Club!\n\nLet's continue crushing those goals. See you at the gym! 💪`,


  inactive: ({ member, absentDays }) =>
    `Hey ${member.fullName}! 🚨 Alert: Your muscles are filing a missing persons report! 🕵️‍♂️\n\nYou haven't been to Galaxy Fitness Club in *${absentDays} days*! Don't let your gains turn into losses. Get off the couch, grab your gym gear, and let's crush some goals today! 💪🔥 See you at the gym!`,

  payment_reminder: ({ member }) =>
    `Hello ${member.fullName},\n\nThis is a gentle daily reminder that your gym payment of ₹${member.invoiceAmount || 0} is still pending.\n\nPlease clear your dues at the reception at your earliest convenience to avoid interruption of services. Thank you! 🙏`,
};

const getTemplate = (type, data) => {
  const templateFn = templates[type];
  if (!templateFn) {
    throw new Error(`Unknown message template type: ${type}`);
  }
  return templateFn(data);
};

module.exports = { templates, getTemplate };
