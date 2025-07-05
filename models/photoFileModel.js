const db = require("../config/db")
const moment = require('moment')

const PhotoFiles = () => { }

PhotoFiles.getPhotoFilesData = (postData) => {
  let whereCondition = ``
  if (postData.filter && postData.filter.userId) {
    whereCondition += ` AND userId = ${postData.filter.userId}`
  }
  if (postData.filter && postData.filter.id) {
    whereCondition += ` AND id = '${postData.filter.id}'`
  }
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM kps_photofiles_doc WHERE 1 = 1 ${whereCondition}`
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
PhotoFiles.addPhotoFileData = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      userId: postData.userId,
      schedule_id: postData.schedule_id,
      file_url: postData.fileName,
      folder_name: postData.folder_name,
      description: postData.description || '',
      created_by: postData.userId,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ["kps_photofiles_doc", insertedData]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
PhotoFiles.deletePhotoFiles = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `DELETE FROM kps_photofiles_doc WHERE id = ?`
    let values = [postData.id]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}


module.exports = PhotoFiles;
