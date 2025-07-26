const Notification = require("../../models/Notification");
const generic = require("../../config/genricFn/common");

exports.getNotifications = async (req, res) => {
  try {
    const data = await Notification.getNotificationsList(req.body);
    return generic.success(req, res, {
      message: "Notification data retrieved successfully.",
      data: data,
    });
  } catch (error) {
    return generic.error(req, res, {
      message: "Error fetching Notification data",
      details: error.message,
    });
  }
};
