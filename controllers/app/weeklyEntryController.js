const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");
const dailyEntry = require("../../models/dailyEntryModel");
const dailyDiary = require("../../models/dailyDiaryModel");
const weeklyEntry = require("../../models/weeklyEntryModel");
const Project = require("../../models/projectModel");
const User = require("../../models/userModel")
const db = require("../../config/db")
const path = require("path")



exports.getWeeklyReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    let weeklyList = await weeklyEntry.getWeeklyEntry(req.body)
    if (weeklyList.length) {
      for(let row of weeklyList){
        let data = {weeklyEntryId: row.id}
        row.images = await weeklyEntry.getWeeklyEntryImages(data)
        row.dailyDiary = await weeklyEntry.getWeeklyDailyDiary(data)
        row.dailyEntry = await weeklyEntry.getWeeklyDailyEntry(data)
      }
      return generic.success(req, res, {
        message: "Weekly report list.",
        data: weeklyList,
      });

    } else {
      return generic.success(req, res, {
        message: "No user has uploaded their weekly report."
      });

    }
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "something went wrong!",
    });
  }
};
exports.createWeeklyEntry = async (req, res) => {
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
    const checkProjectExist = await Project.getProjectList({ filter: { projectId: req.body.projectId } })
    if (!checkProjectExist) {
      return generic.error(req, res, { message: "Invalid project ID, project not found" });
    }
    const user = await User.checkExistingUser({ userId: req.body.user.userId });
    if (!user.length) {
      return generic.error(req, res, { message: "User not found" });
    }
    const checkDailyEntries = await dailyEntry.getDailyEntry({ filter: { projectId: req.body.projectId, startDate: req.body.startDate, endDate: req.body.endDate } })
    const checkDailyDiaries = await dailyDiary.getDailyDiary({ filter: { projectId: req.body.projectId, startDate: req.body.startDate, endDate: req.body.endDate } })

    const createWeeklyEntry = await weeklyEntry.createWeeklyEntry(req.body)
    if (createWeeklyEntry.insertId) {
      let weeklyEntryId = createWeeklyEntry.insertId
      let data = {}
      if (req.body.images && req.body.images.length) {
        for (let row of req.body.images) {
          data = {
            weeklyEntryId: weeklyEntryId,
            userId: req.body.user.userId,
            path: path.basename(row.path),
            folder_name: path.dirname(row.path)
          }
          await weeklyEntry.addWeeklyImages(data)
        }

      }
      if (checkDailyDiaries && checkDailyDiaries.length) {
        for (let row of checkDailyDiaries) {
          data = {
            weeklyEntryId: weeklyEntryId,
            userId: req.body.user.userId,
            dailyDiaryId: row.id
          }
          await weeklyEntry.addWeeklyDailyDiary(data)
        }

      }
      if (checkDailyEntries && checkDailyEntries.length) {
        for (let row of checkDailyEntries) {
          data = {
            weeklyEntryId: weeklyEntryId,
            userId: req.body.user.userId,
            dailyEntryId: row.id
          }
          await weeklyEntry.addWeeklyDailyEntry(data)
        }

      }
      db.commit()
      return generic.success(req, res, {
        message: "Weekly entry created successfully.",
        data: {
          id: weeklyEntryId,
          project: checkProjectExist,
          linkedDailyEntries: checkDailyEntries,
          linkedDailyDiaries: checkDailyDiaries,
        },
      });
    } else {
      db.rollback()
      return generic.error(req, res, {
        message: "Failed to add weekly entry",
      });

    }
  } catch (error) {
    console.log('error', error)
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "something went wrong!",
    });
  }
};

