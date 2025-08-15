const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");
const Schedule = require("../../models/scheduleModel")
const dailyDiary = require("../../models/dailyDiaryModel");
const dailyEntry = require("../../models/dailyEntryModel");
const path = require("path");
const moment = require("moment");
const fs = require("fs");
const { dailyDiaryTemplate } = require("../../utils/pdfHandlerNew/htmlHandler");
const db = require("../../config/db")

exports.getDailyDiary = async (req, res) => {
  try {
    const dailyDiaries = await dailyDiary.getDailyDiary(req.body);
    return generic.success(req, res, {
      message: "Daily Diary entries retrieved successfully.",
      data: dailyDiaries,
    });
  } catch (error) {
    console.log('error',error)
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};

exports.createDailyDiary = async (req, res) => {
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
     let getScheduleData = await Schedule.getScheduleData({ filter: { schedule_id: req.body.schedule_id } })
    if (!getScheduleData.length) {
      return generic.validationError(req, res, { message: "schedule does'nt exists" });
    }
    const existingDailyEntry = await dailyEntry.getDailyEntry({ filter: { userId: req.body.userId, schedule_id: req.body.schedule_id, selectedDate: req.body.selectedDate } })
    console.log('existingDailyEntry',existingDailyEntry)
    if (existingDailyEntry.length) {
      db.rollback()
      return generic.error(req, res, {
        message: `You have already submitted a daily entry for this project on this date ${moment(req.body.selectedDate).format("DD-MMM-YYYY")}.`,
      });
    }
    let existingDailyDiary = await dailyDiary.getDailyDiary({ filter: { reportNumber: req.body.reportNumber } });

    if (existingDailyDiary && existingDailyDiary.length) {
      req.body.id = existingDailyDiary[0]?.id

      let updatedResult = await dailyDiary.updateDailyDiary(req.body)
      if (updatedResult.affectedRows) {
        db.commit()
        return generic.success(req, res, {
          status: 200,
          message: "Daily Diary updated successfully.",
        });
      } else if (updatedResult && updatedResult.code === 11000) {
        db.rollback()
        return generic.error(req, res, {
          message:
            "Duplicate key violation. Another entry exists with the same unique value.",
          details: updatedResult.message,
        });
      } else {
        db.rollback()
        return generic.error(req, res, {
          message: "Failed to update Daily Diary.",
          details: updatedResult?.message || "Unknown error",
        });
      }
    } else {
      const newDailyDiary = await dailyDiary.createDailyDiary(req.body);
      if (newDailyDiary.insertId) {
        db.commit()
        return generic.success(req, res, {
          message: "Daily Diary created successfully.",
          data: {
            id: newDailyDiary.insertId
          }
        });

      } else {
        db.rollback()
        return generic.error(req, res, {
          message: "Failed to create daily diary",
        });
      }


    }
  } catch (error) {
    console.log('error',error)
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "something went wrong!",
    });
  }
};
