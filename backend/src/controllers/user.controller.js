import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// PATCH /api/users/me
export const updateMe = asyncHandler(async (req, res) => {
  const { currency } = req.body;

  if (!currency) throw new ApiError(400, "Please provide currency");

  // keep a small whitelist (add more if you want)
  const allowed = ["PKR", "USD", "EUR", "GBP", "INR", "AED", "SAR", "TRY", "CNY"];
  if (!allowed.includes(currency)) {
    throw new ApiError(400, "Unsupported currency");
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  user.currency = currency;
  await user.save();

  res.status(200).json(
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
      "Profile updated"
    )
  );
});