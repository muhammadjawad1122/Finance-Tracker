import Category from "../models/Category.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /api/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ userId: req.user._id }).sort({
    type: 1,
    name: 1,
  });

  res
    .status(200)
    .json(new ApiResponse(200, { categories }, "Categories fetched"));
});

// POST /api/categories
export const createCategory = asyncHandler(async (req, res) => {
  const { name, type, color } = req.body;

  if (!name || !type) {
    throw new ApiError(400, "Please provide category name and type");
  }
  if (!["income", "expense"].includes(type)) {
    throw new ApiError(400, "Invalid category type");
  }

  // prevent duplicates for the same user + same type + same name
  const exists = await Category.findOne({
    userId: req.user._id,
    type,
    name: name.trim(),
  });

  if (exists) {
    throw new ApiError(409, "Category already exists");
  }

  const category = await Category.create({
    userId: req.user._id,
    name: name.trim(),
    type,
    color: color || "#607D8B",
    isDefault: false,
  });

  res
    .status(201)
    .json(new ApiResponse(201, { category }, "Category created"));
});

// PATCH /api/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;

  const category = await Category.findOne({ _id: id, userId: req.user._id });
  if (!category) throw new ApiError(404, "Category not found");

  if (category.isDefault) {
    throw new ApiError(403, "Default categories cannot be modified");
  }

  if (name) category.name = name.trim();
  if (color) category.color = color;

  await category.save();

  res
    .status(200)
    .json(new ApiResponse(200, { category }, "Category updated"));
});

// DELETE /api/categories/:id
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findOne({ _id: id, userId: req.user._id });
  if (!category) throw new ApiError(404, "Category not found");

  if (category.isDefault) {
    throw new ApiError(403, "Default categories cannot be deleted");
  }

  await category.deleteOne();

  res.status(200).json(new ApiResponse(200, null, "Category deleted"));
});