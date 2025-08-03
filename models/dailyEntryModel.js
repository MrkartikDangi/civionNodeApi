const db = require("../config/db")
const moment = require('moment')

const dailyEntry = () => { }

dailyEntry.getDailyEntry = (postData) => {
  return new Promise((resolve, reject) => {
    let whereCondition = ``
    if (postData.filter && postData.filter.userId) {
      whereCondition += ` AND userId = ${postData.filter.userId}`
    }
    if (postData.filter && postData.filter.schedule_id) {
      whereCondition += ` AND schedule_id = ${postData.filter.schedule_id}`
    }
    if (postData.filter && postData.filter.selectedDate) {
      whereCondition += ` AND selected_date = '${postData.filter.selectedDate}'`
    }
    if (postData.filter && postData.filter.reportNumber) {
      whereCondition += ` AND reportNumber = '${postData.filter.reportNumber}'`
    }
    if (postData.filter && postData.filter.startDate && postData.filter.endDate) {
      whereCondition += ` AND selected_date BETWEEN '${postData.filter.startDate}' AND '${postData.filter.endDate}' `
    }
    let query = `SELECT kde.*,IFNULL(DATE_FORMAT(kde.created_at, '%Y-%m-%d %H:%i:%s'), '') AS created_at,IFNULL(DATE_FORMAT(kde.updated_at, '%Y-%m-%d %H:%i:%s'), '') AS updated_at,kps_schedules.project_name,kps_schedules.project_number,kps_schedules.owner FROM kps_daily_entry as kde LEFT JOIN kps_schedules ON kde.schedule_id = kde.id WHERE 1 = 1 ${whereCondition}`
    let queryValues = []
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        if (res.length) {
          if (res.length) {
            for (let row of res) {
              row.photoFiles = row.photoFiles !== null ? row.photoFiles.split(",") : []
            }
          }
        }
        resolve(res)
      }

    })

  })
}
dailyEntry.getEquipmentsDetails = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT id,equipment_name,quantity,hours,total_hours FROM kps_daily_entry_equipments WHERE daily_entry_id = ?`
    let queryValues = [postData.dailyEntryId]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }

    })

  })
}
dailyEntry.getVisitorDetails = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT id,visitor_name,company,quantity,hours,total_hours FROM kps_daily_entry_visitors WHERE daily_entry_id = ?`
    let queryValues = [postData.dailyEntryId]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }

    })

  })
}
dailyEntry.getLabourDetails = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT id,contractor_name FROM kps_daily_entry_labours WHERE daily_entry_id = ?`
    let queryValues = [postData.dailyEntryId]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }

    })

  })
}
dailyEntry.getLabourRoleDetails = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT id,role_name,hours,quantity,total_hours FROM kps_daily_entry_labour_roles WHERE labour_id = ?`
    let queryValues = [postData.labour_id]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }

    })

  })
}
dailyEntry.createDailyEntry = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      schedule_id: postData.schedule_id,
      selected_date: postData.selectedDate,
      location: postData.location,
      on_shore: postData.onShore,
      temp_high: postData.tempHigh,
      temp_low: postData.tempLow,
      weather: postData.weather,
      working_day: postData.workingDay,
      report_number: postData.reportNumber,
      contract_number: postData.contractNumber,
      contractor: postData.contractor,
      site_inspector: postData.siteInspector,
      time_in: postData.timeIn,
      time_out: postData.timeOut,
      owner_contact: postData.ownerContact,
      owner_project_manager: postData.ownerProjectManager,
      contract_number: postData.contractNumber,
      component: postData.component,
      description: postData.description,
      photoFiles: postData.photoFiles.length ? postData.photoFiles.join(",") : null,
      userId: postData.user.userId,
      created_by: postData.user.userId,
      created_at: postData.user.dateTime
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_daily_entry', insertedData]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })

  })
}
dailyEntry.addEquipmentsData = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      daily_entry_id: postData.dailyEntryId,
      equipment_name: postData.equipment_name,
      quantity: postData.quantity,
      hours: postData.hours,
      total_hours: postData.totalHours,
      created_by: postData.userId,
      created_at: postData.dateTime
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_daily_entry_equipments', insertedData]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })

  })
}
dailyEntry.addVisitorsData = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      daily_entry_id: postData.dailyEntryId,
      visitor_name: postData.visitorName,
      company: postData.company,
      quantity: postData.quantity,
      hours: postData.hours,
      total_hours: postData.totalHours,
      created_by: postData.userId,
      created_at: postData.dateTime
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_daily_entry_visitors', insertedData]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })

  })
}
dailyEntry.addLaboursData = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      daily_entry_id: postData.dailyEntryId,
      contractor_name: postData.contractorName,
      created_by: postData.userId,
      created_at: postData.dateTime
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_daily_entry_labours', insertedData]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })

  })
}
dailyEntry.addLaboursRoleData = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      labour_id: postData.labour_id,
      role_name: postData.roleName,
      quantity: postData.quantity,
      hours: postData.hours,
      total_hours: postData.totalHours,
      created_by: postData.userId,
      created_at: postData.dateTime
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_daily_entry_labour_roles', insertedData]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })

  })
}

module.exports = dailyEntry