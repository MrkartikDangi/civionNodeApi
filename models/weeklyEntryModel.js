const db = require("../config/db")
const moment = require('moment')

const weeklyEntry = () => { }

weeklyEntry.getWeeklyEntry = (postData) => {
  return new Promise((resolve, reject) => {
    let whereCondition = ``
    if (postData.filter && postData.filter.schedule_id) {
      whereCondition += ` AND schedule_id = ${postData.filter.schedule_id}`
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
        if (res.length) {
          for (let row of res) {
            row.photoFiles = row.photoFiles !== null ? row.photoFiles.split(',') : [],
              row.siteInspector = row.siteInspector !== null ? row.siteInspector.split(',') : [],
              row.weeklyAllList = row.weeklyAllList !== null ? JSON.parse(row.weeklyAllList) : []
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
      schedule_id: postData.schedule_id,
      weekStartDate: postData.startDate,
      weekEndDate: postData.endDate,
      contractNumber: postData.contractNumber || null,
      projectManager: postData.projectManager || null,
      consultantProjectManager: postData.consultantProjectManager || null,
      contractProjectManager: postData.contractProjectManager || null,
      contractorSiteSupervisorOnshore: postData.contractorSiteSupervisorOnshore || null,
      contractorSiteSupervisorOffshore: postData.contractorSiteSupervisorOffshore || null,
      siteInspector: postData.siteInspector.length ? postData.siteInspector.join(',') : null,
      cityProjectManager: postData.cityProjectManager || null,
      inspectorTimeIn: postData.inspectorTimeIn || null,
      inspectorTimeOut: postData.inspectorTimeOut || null,
      contractAdministrator: postData.contractAdministrator || null,
      supportCA: postData.supportCA || null,
      component: postData.component || null,
      photoFiles: postData.photoFiles.length ? postData.photoFiles.join(",") : null,
      weeklyAllList: Object.keys(postData.weeklyAllList).length ? JSON.stringify(postData.weeklyAllList) : '',
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
module.exports = weeklyEntry
