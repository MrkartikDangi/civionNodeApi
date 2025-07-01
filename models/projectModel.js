const db = require("../config/db")
const moment = require('moment')

var Project = () => { }

Project.getProjectList = (postData) => {
  let whereCondition = ``
  if (postData.filter && postData.filter.projectNumber) {
    whereCondition += `AND projectNumber = ${postData.filter.projectNumber}`
  }
  if (postData.filter && postData.filter.projectId) {
    whereCondition += `AND id = ${postData.filter.projectId}`
  }
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM kps_project WHERE 1=1 AND isActive = ? ${whereCondition}`
    let values = ["1"]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
Project.addProjectData = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedValues = {
      projectName: postData.projectName ?? 'default',
      projectNumber: postData.projectNumber ?? 'default',
      owner: postData.owner ?? 'default',
      startDate: postData.startDate ?? 'default',
      endDate: postData.endDate ?? '',
      created_by: postData.user.userId,
      isActive: 1,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_project', insertedValues]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })

}
Project.deleteProject = (postData) => {
  return new Promise((resolve, reject) => {
    let updatedData = {
      isActive: "1",
      updated_at: moment(new Date()).format('YYYY-MM-Dd HH:mm:ss'),
      updated_by: postData.users.userid
    }
    let query = `UPDATE ?? SET ? WHERE id = ?`
    let values = ["kps_project", updatedData, postData.projectId]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

module.exports = Project;
