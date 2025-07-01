const Schedule = require("../../models/scheduleModel");
const Project = require("../../models/projectModel");
const fs = require("fs");
const Notification = require("../../models/Notification");
const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");
const path = require("path");
const axios = require("axios");
const moment = require("moment");
const db = require("../../config/db")

exports.uploadSchedule = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    db.beginTransaction()
    let project = await Project.getProjectList(req.body);
    if (!project.length) {
      db.rollback()
      return generic.error(req, res, {
        message: "Invalid Project Id",
      });
    }
    req.body.pdfUrl = path.basename(req.body.pdfUrl);
    req.body.folder_name = path.dirname(req.body.pdfUrl);
    const addSchedule = await Schedule.addScheduleData(req.body)
    if (addSchedule.insertId) {
      db.commit()
      return generic.success(req, res, {
        message: "Schedule Data Added successfully",
        data: {
          id: addSchedule.insertId
        }
      });
    } else {
      db.rollback()
      return generic.error(req, res, {
        message: "Failed to add schedule data",
      });
    }
  } catch (error) {
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.getScheduleData = async (req, res) => {
  try {
    const schedulesData = await Schedule.getScheduleData()
    if (schedulesData.length) {
      for (let x of schedulesData) {
        x.pdfUrl = `${process.env.Base_Url}/${x.folder_name}/${x.pdfUrl}`;
      }
    }
    return generic.success(req, res, {
      message: "Schedule data reterived successfully",
      data: schedulesData,
    });
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
