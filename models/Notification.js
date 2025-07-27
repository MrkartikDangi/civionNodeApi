const db = require("../config/db")
const moment = require("moment")

const notification = () => {}


notification.getNotificationsList = (postData) => {
  return new Promise((resolve, reject) => {
    let whereCondition = ``
    if (!postData.user.isBoss) {
        console.log('1')
      whereCondition += ` AND userid = ${postData.user.userId}`
    }
    let query = `SELECT id,subject,message,is_read,IFNULL(DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s'), '') AS created_at FROM kps_notifications WHERE 1 = 1 ${whereCondition} ORDER BY id DESC`
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

notification.addNotificationData = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedValues = {
      userid: postData.userid ,
      subject: postData.subject ,
      message: postData.message,
      created_by: postData.created_by,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_notifications', insertedValues]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
notification.updateNotificationStatus = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedValues = {
      is_read: 1 ,
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }
    let query = `UPDATE ?? SET ? WHERE id IN (${postData.id})`
    let values = ['kps_notifications', insertedValues]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

module.exports = notification