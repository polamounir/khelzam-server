import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });

  if (admin && (await admin.matchPassword(password))) {
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Register a new admin
// @route   POST /api/admin/register
// @access  Private (Super Admin only)
const registerAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  const adminExists = await Admin.findOne({ email });

  if (adminExists) {
    res.status(400).json({ message: 'Admin already exists' });
    return;
  }

  const admin = await Admin.create({
    name,
    email,
    password,
    role: role || 'normal',
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } else {
    res.status(400).json({ message: 'Invalid admin data' });
  }
};

// @desc    Get all admins
// @route   GET /api/admin
// @access  Private (Super Admin only)
const getAdmins = async (req, res) => {
  const admins = await Admin.find({}).select('-password');
  res.json(admins);
};

// @desc    Delete admin
// @route   DELETE /api/admin/:id
// @access  Private (Super Admin only)
const deleteAdmin = async (req, res) => {
  const admin = await Admin.findById(req.params.id);

  if (admin) {
    if (admin.role === 'super') {
      res.status(400).json({ message: 'Cannot delete Super Admin' });
      return;
    }
    await admin.deleteOne();
    res.json({ message: 'Admin removed' });
  } else {
    res.status(404).json({ message: 'Admin not found' });
  }
};

// @desc    Update self profile
// @route   PUT /api/admin/profile
// @access  Private
const updateProfile = async (req, res) => {
  const admin = await Admin.findById(req.admin._id);

  if (admin) {
    admin.name = req.body.name || admin.name;
    admin.email = req.body.email || admin.email;
    if (req.body.password) {
      admin.password = req.body.password;
    }

    const updatedAdmin = await admin.save();

    res.json({
      _id: updatedAdmin._id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      token: generateToken(updatedAdmin._id),
    });
  } else {
    res.status(404).json({ message: 'Admin not found' });
  }
};

export {
  loginAdmin,
  registerAdmin,
  getAdmins,
  deleteAdmin,
  updateProfile,
};
