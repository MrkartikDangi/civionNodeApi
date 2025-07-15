const db = require("../config/db")

const oneDrive = () => {}

oneDrive.getValidOneDriveToken = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT access_token FROM kps_oneDriveToken WHERE expires_at > NOW() ORDER BY created_at DESC LIMIT 1`
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

oneDrive.saveOneDriveToken = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedValues = {
      access_token: postData.access_token,
      expires_at: new Date(Date.now() + expires_in * 1000),
      created_at: postData.dateTime
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_oneDriveToken', insertedValues]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

oneDrive.deleteOneDriveExpiredToken = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `DELETE FROM kps_oneDriveToken WHERE expires_at <= NOW()`
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

module.exports = oneDrive