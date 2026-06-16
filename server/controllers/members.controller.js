const Member = require('../models/Member.model');
const MembershipPlan = require('../models/MembershipPlan.model');
const Attendance = require('../models/Attendance.model');
const Payment = require('../models/Payment.model');
const ActivityLog = require('../models/ActivityLog.model');
const Trainer = require('../models/Trainer.model');
const whatsappService = require('../services/whatsapp.service');
const { addDays, getStartOfDay, getEndOfDay, getDaysRemaining } = require('../utils/dateUtils');
const cloudinary = require('../utils/cloudinary');
const { escapeRegex, safePaginationLimit, safePage, pickFields, sanitizeTextFields } = require('../utils/sanitize');

// GET /api/v1/members
const getMembers = async (req, res, next) => {
  try {
    const { search, status, paymentStatus, plan, gender, page, limit } = req.query;
    const safeLim = safePaginationLimit(limit);
    const safePg = safePage(page);
    const query = { status: { $ne: 'Deleted' }, adminId: req.user.id };

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { fullName: { $regex: safeSearch, $options: 'i' } },
        { phone: { $regex: safeSearch, $options: 'i' } },
        { memberId: { $regex: safeSearch, $options: 'i' } },
      ];
    }
    if (status) {
      if (status === 'Inactive') {
        const cutoff = new Date();
        cutoff.setHours(0, 0, 0, 0);
        cutoff.setDate(cutoff.getDate() - 5);
        
        query.status = 'Active';
        if (!query.$and) query.$and = [];
        query.$and.push({
          $or: [
            { lastAttendance: { $lt: cutoff } },
            { lastAttendance: null, joiningDate: { $lt: cutoff } },
            { lastAttendance: null, joiningDate: null }
          ]
        });
      } else {
        query.status = status;
      }
    } else {
      query.status = { $nin: ['Deleted', 'Expired'] };
    }
    
    if (plan) query.membershipPlan = plan;
    if (gender) query.gender = gender;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const skip = (safePg - 1) * safeLim;
    const total = await Member.countDocuments(query);

    const members = await Member.find(query)
      .select('-photo -notes')
      .populate('membershipPlan', 'name durationDays price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLim)
      .lean();

    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 5);

    const processedMembers = members.map(m => {
      if (m.status === 'Active') {
        const refDate = m.lastAttendance || m.joiningDate;
        if (!refDate || new Date(refDate) < cutoff) {
          m.status = 'Inactive';
        }
      }
      return m;
    });

    res.json({
      success: true,
      data: processedMembers,
      pagination: {
        total,
        page: safePg,
        limit: safeLim,
        pages: Math.ceil(total / safeLim),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/members
const createMember = async (req, res, next) => {
  try {
    const MEMBER_CREATE_FIELDS = [
      'fullName', 'phone', 'email', 'address', 'gender', 'age',
      'joiningDate', 'membershipPlan', 'membershipStartDate',
      'paymentStatus', 'paymentMethod', 'notes', 'whatsappOptIn',
      'trainerNeeded', 'trainer', 'dietNeeded'
    ];
    const safeBody = sanitizeTextFields(
      pickFields(req.body, MEMBER_CREATE_FIELDS),
      ['fullName', 'email', 'address', 'notes']
    );
    const { fullName, phone, email, address, gender, age, joiningDate, membershipPlan, membershipStartDate, paymentStatus, paymentMethod, notes, whatsappOptIn, trainerNeeded, trainer, dietNeeded } = safeBody;
    const { forceReplace } = req.query;

    const existingMember = await Member.findOne({ phone, adminId: req.user.id });
    if (existingMember) {
      if (existingMember.status === 'Deleted' || forceReplace === 'true') {
        await Member.findByIdAndDelete(existingMember._id);
        await Attendance.deleteMany({ member: existingMember._id });
        await Payment.deleteMany({ member: existingMember._id });
        const WhatsAppLog = require('../models/WhatsAppLog.model');
        await WhatsAppLog.deleteMany({ member: existingMember._id });
      } else {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_PHONE',
          error: 'This phone number is already registered.',
          existingMember: {
            _id: existingMember._id,
            fullName: existingMember.fullName,
            phone: existingMember.phone
          }
        });
      }
    }

    // Calculate expiry date from plan
    let expiryDate = null;
    let planPrice = 0;
    let planName = 'Custom Plan';
    let months = 1;
    const startDate = membershipStartDate ? new Date(membershipStartDate) : new Date(joiningDate);
    if (membershipPlan) {
      const plan = await MembershipPlan.findById(membershipPlan);
      if (plan) {
        expiryDate = addDays(startDate, plan.durationDays);
        planPrice = plan.price;
        planName = plan.name;
        months = Math.max(1, Math.round(plan.durationDays / 30));
      }
    }

    let trainerPrice = 0;
    let dietPrice = 0;
    let trainerName = '';
    if (trainerNeeded && trainer) {
      const trainerDoc = await Trainer.findById(trainer);
      if (trainerDoc) {
        trainerPrice = trainerDoc.price * months;
        trainerName = trainerDoc.name;
        if (dietNeeded) {
          dietPrice = trainerDoc.dietCharge * months;
        }
      }
    }

    const totalInvoiceAmount = planPrice + trainerPrice + dietPrice;

    const member = await Member.create({
      adminId: req.user.id,
      fullName,
      phone,
      email,
      address,
      gender,
      age,
      joiningDate: new Date(joiningDate),
      membershipPlan,
      membershipStartDate: startDate,
      membershipExpiryDate: expiryDate,
      paymentStatus: paymentStatus || 'Pending',
      paymentMethod: paymentMethod || 'Cash',
      notes,
      whatsappOptIn: whatsappOptIn !== false,
      trainerNeeded,
      trainer: trainerNeeded ? trainer : null,
      dietNeeded: trainerNeeded ? dietNeeded : false,
      invoiceAmount: totalInvoiceAmount,
    });

    if (paymentStatus === 'Paid') {
      await Payment.create({
        adminId: req.user.id,
        member: member._id,
        amount: totalInvoiceAmount,
        planCost: planPrice,
        trainerCost: trainerPrice,
        dietCost: dietPrice,
        paymentDate: new Date(),
        paymentMethod: paymentMethod || 'Cash',
        plan: membershipPlan
      });
    }

    // Send WhatsApp Invoice
    if (member.whatsappOptIn && process.env.WHATSAPP_ENABLED === 'true') {
      try {
        const { format } = require('date-fns');
        const startDateStr = format(startDate, 'dd MMM yyyy');
        const endDateStr = expiryDate ? format(expiryDate, 'dd MMM yyyy') : 'N/A';
        
        let fullPlanName = planName;
        if (trainerNeeded) fullPlanName += ` + Trainer`;
        if (dietNeeded) fullPlanName += ` + Diet`;

        await whatsappService.sendWelcome(member, paymentStatus === 'Pending', {
          startDate: startDateStr,
          endDate: endDateStr,
          planName: fullPlanName,
          amount: totalInvoiceAmount
        });
      } catch (err) {
        console.error('Failed to send WhatsApp welcome message:', err);
      }
    }

    await member.populate('membershipPlan', 'name durationDays price');

    // Log activity
    await ActivityLog.create({
      adminId: req.user.id,
      action: 'member_added',
      entityType: 'Member',
      entityId: member._id,
      performedBy: req.user.id,
      details: { fullName: member.fullName, memberId: member.memberId },
    });

    res.status(201).json({
      success: true,
      data: member,
      message: 'Member created successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/members/:id
const getMember = async (req, res, next) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, adminId: req.user.id }).populate('membershipPlan', 'name durationDays price');

    if (!member || member.status === 'Deleted') {
      return res.status(404).json({ success: false, error: 'Member not found.', code: 'NOT_FOUND' });
    }

    // Get attendance stats
    const attendanceCount = await Attendance.countDocuments({ member: member._id, status: 'Present' });
    const totalPayments = await Payment.aggregate([
      { $match: { member: member._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        ...member.toObject(),
        stats: {
          totalAttendance: attendanceCount,
          totalPayments: totalPayments[0]?.total || 0,
          daysRemaining: getDaysRemaining(member.membershipExpiryDate),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/members/:id
const updateMember = async (req, res, next) => {
  try {
    const MEMBER_UPDATE_FIELDS = [
      'fullName', 'phone', 'email', 'address', 'gender', 'age',
      'status', 'paymentStatus', 'paymentMethod', 'notes',
      'whatsappOptIn', 'trainerNeeded', 'trainer', 'dietNeeded', 'invoiceAmount',
    ];
    const rawBody = pickFields(req.body, [...MEMBER_UPDATE_FIELDS, 'membershipPlan', 'membershipStartDate']);
    const { membershipPlan, membershipStartDate, ...rest } = sanitizeTextFields(
      rawBody,
      ['fullName', 'email', 'address', 'notes']
    );

    // If the user manually changes the status to 'Deleted' from the edit form, perform a hard delete.
    if (rest.status === 'Deleted') {
      return deleteMember(req, res, next);
    }

    const updateData = { ...rest };

    let isReactivation = false;
    let oldMember = null;
    let newPlanData = null;

    // Recalculate expiry if plan or start date changes
    if (membershipPlan || membershipStartDate) {
      oldMember = await Member.findOne({ _id: req.params.id, adminId: req.user.id });
      const planId = membershipPlan || oldMember.membershipPlan;
      const startDate = membershipStartDate ? new Date(membershipStartDate) : oldMember.membershipStartDate;

      if (planId) {
        const plan = await MembershipPlan.findById(planId);
        if (plan) {
          newPlanData = plan;
          updateData.membershipPlan = planId;
          updateData.membershipStartDate = startDate;
          const newExpiry = addDays(startDate, plan.durationDays);
          updateData.membershipExpiryDate = newExpiry;
          
          // Auto-activate if expiry is in future
          if (newExpiry >= getStartOfDay()) {
            updateData.status = 'Active';
            // Check if it was previously expired/inactive or expiry was in the past
            if (oldMember.status === 'Expired' || oldMember.status === 'Inactive' || (oldMember.membershipExpiryDate && oldMember.membershipExpiryDate < getStartOfDay())) {
              isReactivation = true;
            }
          }
        }
      }
    }

    const member = await Member.findOneAndUpdate({ _id: req.params.id, adminId: req.user.id }, updateData, {
      new: true,
      runValidators: true,
    }).populate('membershipPlan', 'name durationDays price');

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found.', code: 'NOT_FOUND' });
    }

    // Reactivation WhatsApp Message
    if (isReactivation && member.whatsappOptIn && process.env.WHATSAPP_ENABLED === 'true') {
      try {
        let msg = `*Welcome back, ${member.fullName}!* 🎉\n\nYour membership has been successfully reactivated.`;
        if (newPlanData) {
          msg += `\n\n*Current Plan:* ${newPlanData.name}`;
        }
        msg += `\n\nWe are thrilled to see you back at Galaxy Fitness Club!\n\nLet's continue crushing those goals. See you at the gym! 💪`;
        
        const SystemSettings = require('../models/SystemSettings.model');
        const settings = await SystemSettings.findOne();
        
        // Priority: Activation Poster -> Welcome Poster -> Plan Poster
        let posterToSend = settings?.activationPoster || settings?.welcomePoster;
        if (!posterToSend && newPlanData && newPlanData.posterImage) {
          posterToSend = newPlanData.posterImage;
        }
        
        await whatsappService.sendMessage(member.phone, msg, posterToSend);

        const WhatsAppLog = require('../models/WhatsAppLog.model');
        await WhatsAppLog.create({
          member: member._id,
          phone: member.phone,
          messageType: 'reactivation',
          messageText: msg,
          status: 'sent',
          sentAt: new Date()
        });
      } catch (err) {
        console.error('Failed to send WhatsApp reactivation message:', err);
      }
    }

    // Log activity
    await ActivityLog.create({
      adminId: req.user.id,
      action: 'member_updated',
      entityType: 'Member',
      entityId: member._id,
      performedBy: req.user.id,
      details: { fullName: member.fullName, updatedFields: Object.keys(req.body) },
    });

    res.json({ success: true, data: member, message: 'Member updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/members/:id (hard delete)
const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found.', code: 'NOT_FOUND' });
    }

    // Delete associated data
    await Attendance.deleteMany({ member: member._id });
    await Payment.deleteMany({ member: member._id });
    const WhatsAppLog = require('../models/WhatsAppLog.model');
    await WhatsAppLog.deleteMany({ member: member._id });

    await ActivityLog.create({
      adminId: req.user.id,
      action: 'member_deleted',
      entityType: 'Member',
      entityId: member._id,
      performedBy: req.user.id,
      details: { fullName: member.fullName },
    });

    res.json({ success: true, message: 'Member deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/members/:id/photo
const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.', code: 'NO_FILE' });
    }

    // Upload to Cloudinary using a stream
    const uploadToCloudinary = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'gymos_members' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });
    };

    const result = await uploadToCloudinary(req.file.buffer);

    const member = await Member.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user.id },
      { photo: result.secure_url },
      { new: true }
    ).select('-photo'); // we don't need to return the photo string necessarily, wait actually the UI expects it in the response: res.json({data: {photo: member.photo}}). So let's not exclude it from findByIdAndUpdate result.

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found.', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: { photo: member.photo }, message: 'Photo uploaded successfully.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/members/:id/renew
const renewMember = async (req, res, next) => {
  try {
    const { membershipPlan, membershipStartDate, paymentMethod, paymentStatus, notes, trainerNeeded, trainer, dietNeeded } = req.body;

    const member = await Member.findOne({ _id: req.params.id, adminId: req.user.id });
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found.', code: 'NOT_FOUND' });
    }

    const plan = await MembershipPlan.findById(membershipPlan);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Membership plan not found.', code: 'NOT_FOUND' });
    }

    const startDate = new Date(membershipStartDate);
    const expiryDate = addDays(startDate, plan.durationDays);
    const months = Math.max(1, Math.round(plan.durationDays / 30));

    // Resolve trainer preferences: use input if provided, otherwise keep existing
    const tNeeded = trainerNeeded !== undefined ? trainerNeeded : member.trainerNeeded;
    const tId = trainer !== undefined ? trainer : member.trainer;
    const dNeeded = dietNeeded !== undefined ? dietNeeded : member.dietNeeded;

    let trainerPrice = 0;
    let dietPrice = 0;
    let trainerName = '';
    
    if (tNeeded && tId) {
      const trainerDoc = await Trainer.findById(tId);
      if (trainerDoc) {
        trainerPrice = trainerDoc.price * months;
        trainerName = trainerDoc.name;
        if (dNeeded) {
          dietPrice = trainerDoc.dietCharge * months;
        }
      }
    }

    const totalInvoiceAmount = plan.price + trainerPrice + dietPrice;

    // Update Member
    const updatedMember = await Member.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user.id },
      {
        status: 'Active',
        membershipPlan: plan._id,
        membershipStartDate: startDate,
        membershipExpiryDate: expiryDate,
        paymentStatus: paymentStatus || 'Paid',
        paymentMethod: paymentMethod || 'Cash',
        trainerNeeded: tNeeded,
        trainer: tNeeded ? tId : null,
        dietNeeded: tNeeded ? dNeeded : false,
        invoiceAmount: totalInvoiceAmount,
      },
      { new: true, runValidators: true }
    ).populate('membershipPlan', 'name durationDays price');

    // Create Payment if Paid
    if (paymentStatus === 'Paid') {
      await Payment.create({
        adminId: req.user.id,
        member: member._id,
        amount: totalInvoiceAmount,
        planCost: plan.price,
        trainerCost: trainerPrice,
        dietCost: dietPrice,
        paymentDate: new Date(),
        paymentMethod: paymentMethod || 'Cash',
        plan: plan._id,
        notes: notes || 'Renewal Payment',
      });
    }

    // Send WhatsApp Renewal Message
    if (updatedMember.whatsappOptIn && process.env.WHATSAPP_ENABLED === 'true') {
      try {
        let renewalMsg = `Welcome back, ${updatedMember.fullName}! 🎉\n\nYour membership has been successfully renewed with the *${plan.name}* plan (₹${plan.price}).`;
        if (tNeeded) {
          renewalMsg += `\n- Trainer (${trainerName} × ${months}m): ₹${trainerPrice}`;
          if (dNeeded) renewalMsg += `\n- Diet Plan (× ${months}m): ₹${dietPrice}`;
        }
        renewalMsg += `\n\n*Total Amount: ₹${totalInvoiceAmount}*\n\nWe are thrilled to see you back at Galaxy Fitness Club!\n\nLet's continue crushing those goals. See you at the gym! 💪`;

        const SystemSettings = require('../models/SystemSettings.model');
        const settings = await SystemSettings.findOne();
        
        let posterToSend = settings?.welcomePoster;
        if (!posterToSend && plan && plan.posterImage) {
          posterToSend = plan.posterImage;
        }

        await whatsappService.sendMessage(updatedMember.phone, renewalMsg, posterToSend);
        
        const WhatsAppLog = require('../models/WhatsAppLog.model');
        await WhatsAppLog.create({
          member: updatedMember._id,
          phone: updatedMember.phone,
          messageType: 'renewal',
          messageText: renewalMsg,
          status: 'sent',
          sentAt: new Date()
        });
      } catch (err) {
        console.error('Failed to send WhatsApp renewal message:', err);
      }
    }

    // Log activity
    await ActivityLog.create({
      adminId: req.user.id,
      action: 'member_renewed',
      entityType: 'Member',
      entityId: updatedMember._id,
      performedBy: req.user.id,
      details: { fullName: updatedMember.fullName, planName: plan.name },
    });

    res.json({ success: true, data: updatedMember, message: 'Member renewed successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/members/stats/summary
const getMemberStats = async (req, res, next) => {
  try {
    const today = getStartOfDay();
    const sevenDaysLater = addDays(today, 7);

    const [total, active, expired, expiringSoon] = await Promise.all([
      Member.countDocuments({ status: { $ne: 'Deleted' }, adminId: req.user.id }),
      Member.countDocuments({ status: 'Active', adminId: req.user.id }),
      Member.countDocuments({ status: 'Expired', adminId: req.user.id }),
      Member.countDocuments({
        status: 'Active',
        adminId: req.user.id,
        membershipExpiryDate: { $gte: today, $lte: sevenDaysLater },
      }),
    ]);

    res.json({
      success: true,
      data: { total, active, expired, expiringSoon },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/members/expiring
const getExpiringMembers = async (req, res, next) => {
  try {
    const today = getStartOfDay();
    const sevenDaysLater = addDays(today, 7);

    const members = await Member.find({
      adminId: req.user.id,
      status: 'Active',
      membershipExpiryDate: { $gte: today, $lte: sevenDaysLater },
    })
      .select('-photo -notes')
      .populate('membershipPlan', 'name')
      .sort({ membershipExpiryDate: 1 })
      .lean();

    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/members/inactive
const getInactiveMembers = async (req, res, next) => {
  try {
    const { days = 5 } = req.query;
    const today = getStartOfDay();
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - parseInt(days));

    const members = await Member.find({
      adminId: req.user.id,
      status: 'Active',
      $or: [{ lastAttendance: { $lt: cutoff } }, { lastAttendance: null }],
    })
      .select('-photo -notes')
      .populate('membershipPlan', 'name')
      .sort({ lastAttendance: 1 })
      .lean();

    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  createMember,
  getMember,
  updateMember,
  deleteMember,
  uploadPhoto,
  renewMember,
  getMemberStats,
  getExpiringMembers,
  getInactiveMembers,
};
