const Notification = require("../../models/Notification");
const generic = require("../../config/genricFn/common");
const moment = require("moment");

exports.getNotifications = async (req, res) => {
  try {
    let currentDate = moment(new Date()).format("YYYY-MM-DD");
    const data = await Notification.find({ date: currentDate });
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
