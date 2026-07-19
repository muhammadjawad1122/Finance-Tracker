import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// helper: date range
function buildDateMatch(from, to) {
  const match = {};
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }
  return match;
}

// GET /api/stats/summary?from&to
export const getSummary = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const match = {
    userId: new mongoose.Types.ObjectId(req.user._id),
    ...buildDateMatch(from, to),
  };

  const rows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
      },
    },
  ]);

  let incomeTotal = 0;
  let expenseTotal = 0;

  for (const r of rows) {
    if (r._id === "income") incomeTotal = r.total;
    if (r._id === "expense") expenseTotal = r.total;
  }

  const balance = incomeTotal - expenseTotal;

  res.status(200).json(
    new ApiResponse(
      200,
      { incomeTotal, expenseTotal, balance },
      "Summary fetched"
    )
  );
});

// GET /api/stats/by-category?from&to&type=expense|income
export const getByCategory = asyncHandler(async (req, res) => {
  const { from, to, type } = req.query;

  const match = {
    userId: new mongoose.Types.ObjectId(req.user._id),
    ...buildDateMatch(from, to),
  };

  if (type) match.type = type;

  const data = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$categoryId",
        total: { $sum: "$amount" },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        categoryId: "$_id",
        total: 1,
        name: { $ifNull: ["$category.name", "Unknown"] },
        color: { $ifNull: ["$category.color", "#607D8B"] },
        type: { $ifNull: ["$category.type", null] },
      },
    },
    { $sort: { total: -1 } },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, { data }, "Category stats fetched"));
});

// GET /api/stats/monthly?year=2026
export const getMonthly = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const match = {
    userId: new mongoose.Types.ObjectId(req.user._id),
    date: { $gte: start, $lt: end },
  };

  const rows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id.month",
        type: "$_id.type",
        total: 1,
      },
    },
  ]);

  // Fill months 1..12
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expense: 0,
  }));

  for (const r of rows) {
    const idx = r.month - 1;
    if (r.type === "income") months[idx].income = r.total;
    if (r.type === "expense") months[idx].expense = r.total;
  }

  res
    .status(200)
    .json(new ApiResponse(200, { year, months }, "Monthly stats fetched"));
});