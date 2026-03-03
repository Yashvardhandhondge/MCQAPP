const createError = require('http-errors');
const Class = require('../models/Class');
const ClassStudent = require('../models/ClassStudent');
const User = require('../Modals/UserModal');
const { signToken } = require('../utils/token');

const buildAuthPayload = (user) => {
  if (!user) {
    throw new Error('User object is required to build auth payload');
  }
  const safeUser = user.toJSON ? user.toJSON() : user;
  const token = signToken({ id: user._id, role: user.role });
  return { user: safeUser, token };
};

// Public: list active classes for student app
const listActiveClasses = async (req, res, next) => {
  try {
    const classes = await Class.find({ isActive: true })
      .select('_id name logoUrl')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    return next(error);
  }
};

// Admin: create a new class
const createClass = async (req, res, next) => {
  try {
    const { name, logoUrl } = req.body;

    if (!name) {
      return next(createError(400, 'Class name is required'));
    }

    const existing = await Class.findOne({ name: name.trim() });
    if (existing) {
      return next(createError(409, 'Class with this name already exists'));
    }

    const klass = await Class.create({
      name: name.trim(),
      logoUrl: logoUrl?.trim() || undefined,
      createdBy: req.user?._id || undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: klass,
    });
  } catch (error) {
    return next(error);
  }
};

// Admin: list classes with simple stats
const listClassesAdmin = async (req, res, next) => {
  try {
    const classes = await Class.find()
      .sort({ createdAt: -1 })
      .lean();

    const classIds = classes.map((c) => c._id);
    const stats = await ClassStudent.aggregate([
      { $match: { class: { $in: classIds } } },
      {
        $group: {
          _id: '$class',
          totalStudents: { $sum: 1 },
          activatedStudents: {
            $sum: { $cond: [{ $eq: ['$isActivated', true] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = new Map(stats.map((s) => [String(s._id), s]));

    const data = classes.map((c) => {
      const s = statsMap.get(String(c._id));
      return {
        ...c,
        stats: {
          totalStudents: s?.totalStudents || 0,
          activatedStudents: s?.activatedStudents || 0,
        },
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// Admin: update class
const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, logoUrl, isActive } = req.body;

    const updates = {};
    if (typeof name === 'string') updates.name = name.trim();
    if (typeof logoUrl === 'string') updates.logoUrl = logoUrl.trim();
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    const klass = await Class.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!klass) {
      return next(createError(404, 'Class not found'));
    }

    return res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: klass,
    });
  } catch (error) {
    return next(error);
  }
};

// Admin: add / upsert students in a class
const upsertClassStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return next(createError(400, 'Students array is required and cannot be empty'));
    }

    const klass = await Class.findById(id);
    if (!klass) {
      return next(createError(404, 'Class not found'));
    }

    const normalizePhone = (phone) => {
      if (!phone) return null;
      let digits = String(phone).replace(/\D/g, '');
      if (digits.startsWith('91') && digits.length === 12) {
        digits = digits.slice(2);
      }
      if (digits.length !== 10) return null;
      return `+91${digits}`;
    };

    const bulkOps = [];
    for (const s of students) {
      const normalizedPhone = normalizePhone(s.phoneNumber);
      if (!normalizedPhone) {
        continue;
      }
      bulkOps.push({
        updateOne: {
          filter: { class: klass._id, phoneNumber: normalizedPhone },
          update: {
            $set: {
              phoneNumber: normalizedPhone,
              fullName: s.fullName?.trim() || undefined,
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length === 0) {
      return next(createError(400, 'No valid phone numbers provided'));
    }

    await ClassStudent.bulkWrite(bulkOps);

    return res.status(200).json({
      success: true,
      message: 'Students added/updated successfully',
    });
  } catch (error) {
    return next(error);
  }
};

// Admin: list students in a class
const listClassStudents = async (req, res, next) => {
  try {
    const { id } = req.params;

    const klass = await Class.findById(id);
    if (!klass) {
      return next(createError(404, 'Class not found'));
    }

    const students = await ClassStudent.find({ class: id })
      .populate('user', 'fullName email phoneNumber subscription')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        class: klass,
        students,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Student: login via class (no OTP, direct premium)
const loginWithClass = async (req, res, next) => {
  try {
    const { classId, phoneNumber } = req.body;

    if (!classId || !phoneNumber) {
      return next(createError(400, 'classId and phoneNumber are required'));
    }

    const normalizePhone = (phone) => {
      let digits = String(phone).replace(/\D/g, '');
      if (digits.startsWith('91') && digits.length === 12) {
        digits = digits.slice(2);
      }
      if (digits.length !== 10) return null;
      return `+91${digits}`;
    };

    const normalizedPhone = normalizePhone(phoneNumber);
    if (!normalizedPhone) {
      return next(createError(400, 'Invalid phone number format. Must be 10 digits (India)'));
    }

    const klass = await Class.findOne({ _id: classId, isActive: true });
    if (!klass) {
      return next(createError(404, 'Class not found or inactive'));
    }

    const classStudent = await ClassStudent.findOne({
      class: classId,
      phoneNumber: normalizedPhone,
    });

    if (!classStudent) {
      return next(
        createError(
          404,
          'This phone number is not registered under the selected class. Please contact your class admin.'
        )
      );
    }

    let user = await User.findOne({ phoneNumber: normalizedPhone });

    if (!user) {
      user = await User.create({
        fullName: classStudent.fullName || 'Student',
        email: undefined,
        phoneNumber: normalizedPhone,
        subscription: 'premium',
        classId: klass._id,
        className: klass.name,
        classLogoUrl: klass.logoUrl || null,
      });
    } else {
      user.subscription = 'premium';
      user.classId = klass._id;
      user.className = klass.name;
      user.classLogoUrl = klass.logoUrl || null;
      await user.save();
    }

    classStudent.user = user._id;
    classStudent.isActivated = true;
    classStudent.activatedAt = new Date();
    await classStudent.save();

    const response = buildAuthPayload(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully via class access',
      ...response,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listActiveClasses,
  createClass,
  listClassesAdmin,
  updateClass,
  upsertClassStudents,
  listClassStudents,
  loginWithClass,
};

