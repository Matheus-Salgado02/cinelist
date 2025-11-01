import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ReviewSchema = new mongoose.Schema({
  movieId: { type: Number, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: false, unique: true, sparse: true },
  email: { type: String, required: false, unique: true, sparse: true },
  name: { type: String, required: false },
  password: { type: String, required: true },
  watchlist: { type: [String], default: [] },
  bio: { type: String, default: '' },
  favoriteGenres: { type: [String], default: [] },
  reviews: { type: [ReviewSchema], default: [] },
  stats: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// hide password
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', UserSchema);
export default User;

