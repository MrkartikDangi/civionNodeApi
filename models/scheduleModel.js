const db = require("../config/db")
const moment = require('moment')

const Schedule = () => { }

Schedule.getScheduleData = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT kps_schedules.*,kps_project.projectName,kps_project.projectNumber,kps_project.owner,kps_project.startDate,kps_project.endDate FROM kps_schedules LEFT JOIN kps_project ON kps_project.id = kps_schedules.projectId`
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
      projectId: postData.projectId,
      owner: postData.owner,
      month: postData.month,
      pdfUrl: postData.pdfUrl,
      folder_name: postData.folder_name,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      created_by: '2'
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




module.exports = Schedule;
