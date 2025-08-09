const db = require("../config/db")

const invoice = () => { }


invoice.getInvoiceData = (postData) => {
    return new Promise((resolve, reject) => {
        let whereCondition = ``

        let query = `SELECT kps_invoice.*,IFNULL(DATE_FORMAT(kps_invoice.created_at, '%Y-%m-%d %H:%i:%s'), '') AS created_at,IFNULL(DATE_FORMAT(kps_invoice.updated_at, '%Y-%m-%d %H:%i:%s'), '') AS updated_at,IFNULL(
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'invoiceId', kiud.invoiceId,
                'userId', kiud.userId,
                'totalHours', kiud.totalHours,
                'totalBillableHours', kiud.totalBillableHours,
                'subTotal', kiud.subTotal,
                'total', kiud.total
            )
        ),
        JSON_ARRAY()
       ) AS invoiceUserDetails
       FROM kps_invoice LEFT JOIN kps_invoiceuserdetails kiud ON kiud.invoiceId = kps_invoice.id WHERE 1 = 1 ${whereCondition} GROUP BY kps_invoice.id`
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

invoice.createInvoice = (postData) => {
    return new Promise((resolve, reject) => {
        let insertedData = {
            schedule_id: postData.schedule_id,
            fromDate: postData.fromDate,
            toDate: postData.toDate,
            invoiceTo: postData.invoiceTo,
            description: postData.description,
            subTotal: postData.subTotal,
            totalAmount: postData.totalAmount,
            totalBillableHours: postData.totalBillableHours,
            created_by: postData.user.userId,
            created_at: postData.user.dateTime
        }
        let query = `INSERT INTO ?? SET ?`
        let values = ['kps_invoice', insertedData]
        db.query(query, values, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })

    })
}
invoice.addInvoiceUserDetails = (postData) => {
    return new Promise((resolve, reject) => {
        let insertedData = {
            invoiceId: postData.invoiceId,
            userId: postData.userId,
            totalHours: postData.totalHours,
            totalBillableHours: postData.totalBillableHours,
            subTotal: postData.subTotal,
            total: postData.total,
            created_by: postData.createdByUserId,
            created_at: postData.dateTime
        }
        let query = `INSERT INTO ?? SET ?`
        let values = ['kps_invoiceuserdetails', insertedData]
        db.query(query, values, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })

    })
}


module.exports = invoice