const db = require("../config/db")
const moment = require('moment')

var Email = () => {}

Email.checkExisitingMail = (postData) => {
  return new Promise((resolve,reject) => {
    let query = `SELECT * FROM kps_verified_emails WHERE email = ?`
    let values = [postData.email]
    db.query(query,values,(err,res) => {
      if(err){
        reject(err)
      }else{
        resolve(res)
      }
    })
  })
}
Email.addCompanyEmail = (postData) => {
  return new Promise((resolve,reject) => {
    let insertedData = {
      email: postData.email,
      isBoss: postData.isBoss,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      created_by: '2'
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ["kps_verified_emails",insertedData]
    db.query(query,values,(err,res) => {
      if(err){
        reject(err)
      }else{
        resolve(res)
      }
    })
  })
}

module.exports = Email;
