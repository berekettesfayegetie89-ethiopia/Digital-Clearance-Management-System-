import { Notification } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [["sent_at", "DESC"]],
    limit: 50,
  });
  res.json({ notifications });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.update({ read_at: new Date() }, { where: { user_id: req.user.id, read_at: null } });
  res.json({ message: "All notifications marked as read." });
});
