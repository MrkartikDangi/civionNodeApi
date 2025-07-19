const db = require("../config/db")
const moment = require("moment")

const mileage = () => { }


mileage.getUserMileage = (postData) => {
    return new Promise((resolve, reject) => {
        let whereCondition = ``
        if (postData.filter && postData.filter.userId) {
            whereCondition += ` AND user_id = ${postData.filter.userId}`
        }
        if (postData.filter && postData.filter.startDate && postData.filter.endDate) {
            whereCondition += ` AND date BETWEEN '${moment.utc(postData.filter.startDate).format('YYYY-MM-DD HH:mm:ss')}' AND '${moment.utc(postData.filter.endDate).format('YYYY-MM-DD HH:mm:ss')}'`
        }
        if (postData.filter && postData.filter.append_to_expense) {
            whereCondition += ` AND append_to_expense = ${postData.filter.append_to_expense}`
        }
        let query = `SELECT km.*, IFNULL(DATE_FORMAT(km.date, '%Y-%m-%d %H:%i:%s'), '') AS date, IFNULL(DATE_FORMAT(km.created_at, '%Y-%m-%d %H:%i:%s'), '') AS created_at, IFNULL((SELECT JSON_ARRAYAGG(JSON_OBJECT('latitude', coord.latitude, 'longitude', coord.longitude)) FROM kps_mileage_coordinates AS coord WHERE coord.mileage_id = km.id), JSON_ARRAY()) AS coordinates FROM kps_mileage AS km WHERE 1 = 1 ${whereCondition};`
        let values = []
        console.log('query', query)
        db.query(query, values, (err, res) => {
            if (err) {
                reject(err)
            } else {
                if (res.length) {
                    for (let row of res) {
                        row.coordinates = JSON.parse(row.coordinates)
                    }
                }
                resolve(res)
            }
        })
    })
}

mileage.addUserMileage = (postData) => {
    return new Promise((resolve, reject) => {
        let insertedData = {
            user_id: postData.user.userId,
            startLocation: postData.startLocation,
            endLocation: postData.endLocation,
            date: moment.utc(postData.date).format('YYYY-MM-DD HH:mm:ss'),
            totalDistance: postData.distance.toFixed(2),
            duration: postData.duration,
            amount: postData.amount.toFixed(2),
            append_to_expense: 0,
            created_at: postData.user.dateTime,
            created_by: postData.user.userId
        }
        let query = `INSERT INTO ?? SET ?`
        let values = ['kps_mileage', insertedData]
        db.query(query, values, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })

    })
}
mileage.addUserMileageCoordinates = (postData) => {
    return new Promise((resolve, reject) => {
        let insertedData = {
            mileage_id: postData.mileage_id,
            latitude: postData.latitude,
            longitude: postData.longitude,
            created_at: postData.dateTime,
            created_by: postData.userId
        }
        let query = `INSERT INTO ?? SET ?`
        let values = ['kps_mileage_coordinates', insertedData]
        db.query(query, values, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })

    })
}

module.exports = mileage