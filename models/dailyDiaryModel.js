const db = require("../config/db")
const moment = require('moment')

const dailyDiary = () => { }

dailyDiary.getDailyDiary = (postData) => {
    return new Promise((resolve, reject) => {
        let whereCondition = ``
        if (postData.filter && postData.filter.userId) {
            whereCondition += ` AND userId = ${postData.filter.userId}`
        }
        if (postData.filter && postData.filter.schedule_id) {
            whereCondition += ` AND schedule_id = ${postData.filter.schedule_id}`
        }
        if (postData.filter && postData.filter.selectedDate) {
            whereCondition += ` AND selectedDate = ${postData.filter.userId}`
        }
        if (postData.filter && postData.filter.reportNumber) {
            whereCondition += ` AND reportNumber = '${postData.filter.reportNumber}'`
        }
        let query = `SELECT kps_daily_diary.*,IFNULL(DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s'), '') AS created_at,IFNULL(DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s'), '') AS updated_at FROM kps_daily_diary WHERE 1 = 1 ${whereCondition}`
        let queryValues = []
        db.query(query, queryValues, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }

        })

    })
}
dailyDiary.createDailyDiary = (postData) => {
    return new Promise((resolve, reject) => {
        let insertedData = {
            schedule_id: postData.schedule_id,
            selectedDate: postData.selectedDate,
            owner: postData.owner,
            ownerProjectManager: postData.ownerProjectManager,
            contractNumber: postData.contractNumber,
            contractor: postData.contractor,
            ownerContact: postData.ownerContact,
            description: postData.description,
            IsChargable: postData.IsChargable,
            reportNumber: postData.reportNumber,
            userId: postData.user.userId,
            created_by: postData.user.userId,
            created_at: postData.user.dateTime
        }
        let query = `INSERT INTO ?? SET ?`
        let values = ['kps_daily_diary', insertedData]
        db.query(query, values, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })

    })
}
dailyDiary.updateDailyDiary = (postData) => {
    return new Promise((resolve, reject) => {
        let updatedValues = {
            schedule_id: postData.schedule_id,
            selectedDate: postData.selectedDate,
            owner: postData.owner,
            ownerProjectManager: postData.ownerProjectManager,
            contractNumber: postData.contractNumber,
            contractor: postData.contractor,
            ownerContact: postData.ownerContact,
            description: postData.description,
            IsChargable: postData.IsChargable,
            reportNumber: postData.reportNumber,
            userId: postData.user.userId,
            updated_by: postData.user.userId,
            updated_at: postData.user.dateTime,
        }
        let query = `UPDATE ?? SET ? WHERE id = ?`
        let values = ['kps_daily_diary', updatedValues, postData.id]
        db.query(query, values, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })

    })
}

module.exports = dailyDiary;
