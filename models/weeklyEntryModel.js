const db = require("../config/db")
const moment = require('moment')

const weeklyEntry = () => { }

weeklyEntry.getWeeklyEntry = (postData) => {
  return new Promise((resolve, reject) => {
    let whereCondition = ``
    if (postData.filter && postData.filter.schedule_id) {
      whereCondition += ` AND kwe.schedule_id = ${postData.filter.schedule_id}`
    }
    if (postData.filter && postData.filter.startDate && postData.filter.endDate) {
      whereCondition += ` AND kwe.reportDate BETWEEN '${postData.filter.startDate}' AND '${postData.filter.endDate}'`
    }
    if (postData.filter && postData.filter.selectedDate) {
      whereCondition += ` AND kwe.reportDate = '${postData.filter.selectedDate}'`
    }
    if (postData.filter && postData.filter.userId) {
      whereCondition += ` AND userId = ${postData.filter.userId}`
    }
    let query = `SELECT  kwe.*,IFNULL(DATE_FORMAT(kwe.created_at, '%Y-%m-%d %H:%i:%s'), '') AS created_at,IFNULL(DATE_FORMAT(kwe.updated_at, '%Y-%m-%d %H:%i:%s'), '') AS updated_at,IFNULL(DATE_FORMAT(kwe.reportDate, '%Y-%m-%d'), '') AS reportDate,IFNULL(DATE_FORMAT(kwe.weekStartDate, '%Y-%m-%d'), '') AS weekStartDate,IFNULL(DATE_FORMAT(kwe.weekEndDate, '%Y-%m-%d'), '') AS weekEndDate ,kps_users.username,kps_users.email, CASE  
                         WHEN kwe.logo IS NOT NULL THEN (
                                            COALESCE(
                                                (
                                                    SELECT JSON_ARRAYAGG(
                                                        JSON_OBJECT(
                                                            'filename',kl.logoUrl,
                                                            'path', IFNULL(CONCAT('${process.env.Base_Url}', kl.folder_name, '/', kl.logoUrl), '')
                                                        )
                                                    )
                                                    FROM kps_logos kl
                                                    WHERE FIND_IN_SET(kl.id, kwe.logo)
                                                ),
                                                JSON_ARRAY()
                                            )
                                        )
                                        ELSE JSON_ARRAY()
                                    END AS logo,
                                    CASE  
                                        WHEN kwe.photoFiles IS NOT NULL THEN (
                                            COALESCE(
                                                (
                                                    SELECT JSON_ARRAYAGG(
                                                        JSON_OBJECT(
                                                            'filename', kpfd.file_url,
                                                            'path', IFNULL(CONCAT('${process.env.Base_Url}', kpfd.folder_name, '/', kpfd.file_url), '')
                                                        )
                                                    )
                                                    FROM kps_photofiles_doc kpfd
                                                    WHERE FIND_IN_SET(kpfd.id, kwe.photoFiles)
                                                ),
                                                JSON_ARRAY()
                                            )
                                        )
                                        ELSE JSON_ARRAY()
                                    END AS photoFiles               
    FROM kps_weekly_entry kwe LEFT JOIN kps_users ON kps_users.id = kwe.userId WHERE 1 = 1 ${whereCondition}`
    let queryValues = []
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        if (res.length) {
          for (let row of res) {
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
      reportDate: postData.reportDate,
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
      logo: postData.logo ? postData.logo.join(',') : null,
      signature: postData.signature,
      pdfName: postData.pdfName,
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
