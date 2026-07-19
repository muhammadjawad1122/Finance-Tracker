import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /api/transactions?from&to&type&categoryId&page&limit
export const getTransactions = asyncHandler(async (req, res) => {
  const {
    from,
    to,
    type,
    categoryId,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = { userId: req.user._id };

  if (type) {
    if (!["income", "expense"].includes(type)) {
      throw new ApiError(400, "Invalid type filter");
    }
    filter.type = type;
  }

  if (categoryId) {
    // ensure category belongs to user
    const cat = await Category.findOne({ _id: categoryId, userId: req.user._id });
    if (!cat) throw new ApiError(400, "Invalid categoryId");
    filter.categoryId = categoryId;
  }

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("categoryId", "name type color"),
    Transaction.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
      "Transactions fetched"
    )
  );
});

// POST /api/transactions
export const createTransaction = asyncHandler(async (req, res) => {
  const { amount, categoryId, date, note } = req.body;

  if (!amount || !categoryId) {
    throw new ApiError(400, "Please provide amount and categoryId");
  }

  const category = await Category.findOne({ _id: categoryId, userId: req.user._id });
  if (!category) throw new ApiError(400, "Invalid categoryId");

  const txn = await Transaction.create({
    userId: req.user._id,
    categoryId,
    type: category.type, // derive type from category
    amount: Number(amount),
    date: date ? new Date(date) : new Date(),
    note: note || "",
  });

  const populated = await Transaction.findById(txn._id).populate(
    "categoryId",
    "name type color"
  );

  res
    .status(201)
    .json(new ApiResponse(201, { transaction: populated }, "Transaction created"));
});

// PATCH /api/transactions/:id
export const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, categoryId, date, note } = req.body;

  const txn = await Transaction.findOne({ _id: id, userId: req.user._id });
  if (!txn) throw new ApiError(404, "Transaction not found");

  if (categoryId) {
    const category = await Category.findOne({
      _id: categoryId,
      userId: req.user._id,
    });
    if (!category) throw new ApiError(400, "Invalid categoryId");
    txn.categoryId = categoryId;
    txn.type = category.type; // keep type in sync
  }

  if (amount !== undefined) txn.amount = Number(amount);
  if (date) txn.date = new Date(date);
  if (note !== undefined) txn.note = note;

  await txn.save();

  const populated = await Transaction.findById(txn._id).populate(
    "categoryId",
    "name type color"
  );

  res
    .status(200)
    .json(new ApiResponse(200, { transaction: populated }, "Transaction updated"));
});

// DELETE /api/transactions/:id
export const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const txn = await Transaction.findOne({ _id: id, userId: req.user._id });
  if (!txn) throw new ApiError(404, "Transaction not found");

  await txn.deleteOne();

  res.status(200).json(new ApiResponse(200, null, "Transaction deleted"));
});