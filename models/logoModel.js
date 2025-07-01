const db = require("../config/db")
const moment = require('moment')

const Logo = () => {}

Logo.getLogosList = (postData) => {
  return new Promise((resolve,reject) => {
    let query = `SELECT * FROM kps_logos`
    let values = []
    db.query(query,values,(err,res) => {
      if(err){
        reject(err)
      }else{
        resolve(res)
      }
    })
  })
}
Logo.addLogos = (postData) => {
  return new Promise((resolve,reject) => {
    let insertedValues = {
      companyName: postData.companyName ?? 'default',
      folder_name: postData.folder_name ?? 'default',
      logoUrl: postData.logoUrl ?? 'Unknown URL',
      created_by: postData.user.userId,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    }
    let query = `INSERT INTO ?? SET ?`
    let values = ['kps_logos',insertedValues]
    db.query(query,values,(err,res) => {
      if(err){
        reject(err)
      }else{
        resolve(res)
      }
    })
  })
}






module.exports = Logo;
