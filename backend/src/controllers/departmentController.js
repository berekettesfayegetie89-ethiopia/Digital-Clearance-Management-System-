import { Department, User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.findAll({ include: [{ model: User, as: "head", attributes: ["id", "full_name"] }] });
  res.json({ departments });
});

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, head_user_id } = req.body;
  const department = await Department.create({ name, code, head_user_id: head_user_id || null });
  res.status(201).json({ department });
});
