import mongoose from 'mongoose';
import User, { ROLES } from './User.js';

/** Admin extends User. Manages members, trainers, memberships and reports. */
const adminSchema = new mongoose.Schema({});

const Admin = User.discriminator('Admin', adminSchema, ROLES.ADMIN);
export default Admin;
