import User from "../models/User.js";
import Category from "../models/Category.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { DEFAULT_CATEGORIES } from "../constants.js";

const cookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,                 // true on HTTPS in production
    sameSite: isProd ? "none" : "lax", // "none" needed if frontend/backend are on different domains
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

// ─── REGISTER ──────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Please provide name, email and password");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const user = await User.create({ name, email, password });

  // Create default categories for this user
  const categoriesToCreate = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    userId: user._id,
    isDefault: true,
  }));
  await Category.insertMany(categoriesToCreate);

  const token = user.generateToken();

  // Cookie-only auth
  res.cookie("token", token, cookieOptions());

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
        },
      },
      "Registration successful"
    )
  );
});

// ─── LOGIN ─────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = user.generateToken();

  // Cookie-only auth
  res.cookie("token", token, cookieOptions());

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
        },
      },
      "Login successful"
    )
  );
});

// ─── GET CURRENT USER ──────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
      "User fetched successfully"
    )
  );
});

// ─── LOGOUT ────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  // clear cookie with same options
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});