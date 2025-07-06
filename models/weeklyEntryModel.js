const db = require("../config/db")
const moment = require('moment')

const weeklyEntry = () => { }

weeklyEntry.getWeeklyEntry = (postData) => {
  return new Promise((resolve, reject) => {
    let whereCondition = ``
    if (postData.filter && postData.filter.projectId) {
      whereCondition += ` AND projectId = ${postData.filter.projectId}`
    }
    if (postData.filter && postData.filter.startDate) {
      whereCondition += ` AND weekStartDate = '${postData.filter.startDate}'`
    }
    if (postData.filter && postData.filter.endDate) {
      whereCondition += ` AND weekEndDate = '${postData.filter.endDate}'`
    }
    let query = `SELECT  kps_weekly_entry.*,kps_users.username,kps_users.email FROM kps_weekly_entry LEFT JOIN kps_users ON kps_users.id = kps_weekly_entry.userId WHERE 1 = 1 ${whereCondition}`
    let queryValues = []
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }

    })

  })
}
weeklyEntry.getWeeklyDailyEntry = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT kps_user_weekly_daily_entry.*,kps_daily_entry.userId,kps_daily_entry.projectId,kps_daily_entry.owner_project_manager,kps_daily_entry.owner_contact,kps_daily_entry.selected_date,kps_daily_entry.location,kps_daily_entry.on_shore,kps_daily_entry.temp_high,kps_daily_entry.temp_low,kps_daily_entry.weather,kps_daily_entry.working_day,kps_daily_entry.report_number,kps_daily_entry.contract_number,kps_daily_entry.contractor,kps_daily_entry.site_inspector,kps_daily_entry.time_in,kps_daily_entry.time_out,kps_daily_entry.component,kps_daily_entry.description FROM kps_user_weekly_daily_entry LEFT JOIN kps_daily_entry ON kps_daily_entry.id = kps_user_weekly_daily_entry.dailyEntryId WHERE kps_user_weekly_daily_entry.weeklyEntryId = ? `
    let queryValues = [postData.weeklyEntryId]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }

    })

  })
}
weeklyEntry.getWeeklyDailyDiary = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT  kps_user_weekly_daily_diary.*,kps_daily_diary.selectedDate,kps_daily_diary.ownerProjectmanager,kps_daily_diary.reportNumber,kps_daily_diary.contractNumber,kps_daily_diary.contractor,kps_daily_diary.ownerContact,kps_daily_diary.description,kps_daily_diary.isChargable,kps_daily_diary.created_by,kps_daily_diary.created_at FROM kps_user_weekly_daily_diary LEFT JOIN kps_daily_diary ON kps_daily_diary.id = kps_user_weekly_daily_diary.dailyDiaryId WHERE kps_user_weekly_daily_diary.weeklyEntryId = ?`
    let queryValues = [postData.weeklyEntryId]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }

    })

  })
}
weeklyEntry.getWeeklyEntryImages = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT id,path,folder_name FROM kps_weekly_entry_images WHERE weeklyEntryId = ?`
    let queryValues = [postData.weeklyEntryId]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        if(res.length){
          for(let row of res){
            row.path = `${process.env.Base_Url}/${row.folder_name}/${row.path}`
          }
        }
        resolve(res)
      }

    })

  })
}
weeklyEntry.createWeeklyEntry = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      userId: postData.user.userId,
      projectId: postData.projectId,
      weekStartDate: postData.startDate,
      weekEndDate: postData.endDate,
      contractNumber: postData.contractNumber || null,
      projectManager: postData.projectManager || null,
      consultantProjectManager: postData.consultantProjectManager || null,
      contractProjectManager: postData.contractProjectManager || null,
      contractorSiteSupervisorOnshore: postData.contractorSiteSupervisorOnshore || null,
      contractorSiteSupervisorOffshore: postData.contractorSiteSupervisorOffshore || null,
      siteInspector: postData.siteInspector || null,
      cityProjectManager: postData.cityProjectManager || null,
      inspectorTimeIn: postData.inspectorTimeIn || null,
      inspectorTimeOut: postData.inspectorTimeOut || null,
      IsChargable: postData.IsChargable || null,
      contractAdministrator: postData.contractAdministrator || null,
      supportCA: postData.supportCA || null,
      component: postData.component || null,
      created_at: postData.user.dateTime,
      created_by: postData.user.userId
    }
    let query = `INSERT INTO ?? SET ?`
    let queryValues = ["kps_weekly_entry", insertedData]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
weeklyEntry.addWeeklyDailyEntry = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      weeklyEntryId: postData.weeklyEntryId,
      dailyEntryId: postData.dailyEntryId,
      created_at: postData.dateTime,
      created_by: postData.userId
    }
    let query = `INSERT INTO ?? SET ?`
    let queryValues = ["kps_user_weekly_daily_entry", insertedData]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
weeklyEntry.addWeeklyDailyDiary = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      weeklyEntryId: postData.weeklyEntryId,
      dailyDiaryId: postData.dailyDiaryId,
      created_at: postData.dateTime,
      created_by: postData.userId
    }
    let query = `INSERT INTO ?? SET ?`
    let queryValues = ["kps_user_weekly_daily_diary", insertedData]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
weeklyEntry.addWeeklyImages = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      weeklyEntryId: postData.weeklyEntryId,
      path: postData.path,
      folder_name: postData.folder_name || 'weeklyEntry',
      created_at: postData.dateTime,
      created_by: postData.userId
    }
    let query = `INSERT INTO ?? SET ?`
    let queryValues = ["kps_weekly_entry_images", insertedData]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
module.exports = weeklyEntry
