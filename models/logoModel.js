const db = require("../config/db")
const moment = require('moment')

const Logo = () => { }

Logo.getLogosList = (postData) => {
  return new Promise((resolve, reject) => {
    let whereCondition = ``
    if (postData.filter && postData.filter.logoid) {
      whereCondition += ` AND id = ${postData.filter.logoid}`
    }
    let query = `SELECT * FROM kps_logos WHERE is_active = ? ${whereCondition}`
    let values = ['1']
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
Logo.addLogos = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedValues = {
      companyName: postData.companyName ?? 'default',
      folder_name: postData.folder_name ?? 'default',
      logoUrl: postData.logoUrl ?? 'Unknown URL',
      is_active: '1',
      created_by: postData.userId,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_logos', insertedValues]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
Logo.editLogo = (postData) => {
  return new Promise((resolve, reject) => {
    let updatedValues = {
      companyName: postData.companyName ?? 'default',
      folder_name: postData.folder_name ?? 'default',
      logoUrl: postData.logoUrl ?? 'Unknown URL',
      is_active: '1',
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      updated_by: postData.userId
    }
    let query = `UPDATE ?? SET ? WHERE id = ?`
    let values = ['kps_logos', updatedValues, postData.id]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
Logo.deleteLogo = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `DELETE FROM ?? WHERE id = ?`
    let values = ['kps_logos', postData.id]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}






module.exports = Logo;
