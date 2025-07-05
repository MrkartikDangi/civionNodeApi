const db = require("../config/db")
const moment = require('moment')

const Schedule = () => { }

Schedule.getScheduleData = (postData) => {
  return new Promise((resolve, reject) => {
    let whereCondition = ``
    if(postData.filter && postData.filter.schedule_id){
      whereCondition += `And id = ${postData.filter.schedule_id}`
    }
    let query = `SELECT * FROM kps_schedules WHERE 1 = 1 ${whereCondition}`
    let values = []
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

Schedule.addScheduleData = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      project_name: postData.project_name,
      project_number: postData.project_number,
      owner: postData.owner,
      description: postData.description || '',
      pdfUrl: postData.path,
      rate: postData.rate,
      invoice_to: postData.invoice_to,
      folder_name: postData.folder_name,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      created_by: postData.user.userId
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_schedules', insertedData]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
Schedule.updateScheduleData = (postData) => {
  return new Promise((resolve, reject) => {
    let updatedData = {
      project_name: postData.project_name,
      project_number: postData.project_number,
      owner: postData.owner,
      description: postData.description || '',
      pdfUrl: postData.pdfUrl,
      rate: postData.rate,
      invoice_to: postData.invoice_to,
      folder_name: postData.folder_name,
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      updated_by: postData.user.userId
    }
    let query = `UPDATE ?? SET ? WHERE id = ?`
    let values = ['kps_schedules', updatedData,postData.id]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
Schedule.deleteScheduleData = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `DELETE FROM ?? WHERE id = ?`
    let values = ['kps_schedules',postData.id]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}




module.exports = Schedule;
