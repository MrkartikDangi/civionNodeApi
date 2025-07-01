const db = require("../config/db")
const moment = require('moment')

var User = () => { }

User.checkExisitingUser = (postData) => {
  let whereCondition = ``
  if (postData.userId) {
    whereCondition += ` OR id = ${postData.userId}`
  }
  if (postData.email) {
    whereCondition += ` OR email = '${postData.email}'`
  }
  if (postData.username) {
    whereCondition += ` OR username = '${postData.username}'`
  }
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM kps_users WHERE 1 = 1 ${whereCondition}`
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
User.createUser = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedValues = {
      email: postData.email,
      password: postData.hashedPassword,
      username: postData.username,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_users', insertedValues]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
User.updateUserLocation = (postData) => {
  return new Promise((resolve, reject) => {
    let updatedValues = {
      latitude: postData.latitude,
      longitude: postData.longitude,
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    }
    let query = `UPDATE ?? SET ? WHERE id = ?`
    let values = ['kps_users', updatedValues, postData.userId]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
User.updateCodeDetails = (postData) => {
  return new Promise((resolve, reject) => {
    let updatedValues = {
      verificationCode: postData.verificationCode,
      codeExpiration: postData.codeExpiration,
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    }
    let query = `UPDATE ?? SET ? WHERE id = ?`
    let values = ['kps_users', updatedValues, postData.id]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
User.updateUserPassword = (postData) => {
  return new Promise((resolve, reject) => {
    let updatedValues = {
      password: postData.password,
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    }
    let query = `UPDATE ?? SET ? WHERE id = ?`
    let values = ['kps_users', updatedValues, postData.id]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
module.exports = User;
