const db = require("../config/db")
const moment = require('moment')

const jobHazard = () => {}

jobHazard.addJobHazardData = (postData) => {
  return new Promise((resolve,reject) => {
    let insertedData = {
      schedule_id: postData.schedule_id,
      selected_date: postData.selectedDate,
      time: postData.time,
      location: postData.location,
      description: postData.description,
      reviewed_by: postData.reviewedBy,
      review_signature: postData.reviewSignature,
      date_reviewed: postData.dateReviewed,
      created_by: postData.user.userId,
      created_on: postData.user.dateTime,
    }
    let query = `INSERT INTO ?? SET ?`
    let queryValues = ['kps_jobhazard',insertedData]
    db.query(query,queryValues,(err,res) => {
      if(err){
        reject(err)
      }else{
        resolve(res)
      }
    })
  })
}
module.exports = jobHazard