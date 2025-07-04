const db = require("../config/db")
const moment = require('moment')

const expense = () => { }


expense.getExpenseData = (postData) => {
  return new Promise((resolve, reject) => {
    let whereCondition = ``
    if (postData.filter && postData.filter.userId) {
      whereCondition += ` AND userId = ${postData.filter.userId}`
    }
    if (postData.filter && postData.filter.expense_id) {
      whereCondition += ` AND kps_expense.id = ${postData.filter.expense_id}`
    }
    if (postData.filter && postData.filter.startDate && postData.filter.endDate) {
      whereCondition += ` AND kps_expense.createdAt BETWEEN '${postData.filter.startDate}' AND '${postData.filter.endDate}' `
    }
    if (postData.filter && postData.filter.expenseStatus) {
      whereCondition += ` AND kps_expense.expenseStatus = '${postData.filter.expenseStatus}'`
    }
    if (postData.filter && postData.filter.mileageStatus) {
      whereCondition += ` AND kps_expense.mileageStatus = '${postData.filter.mileageStatus}'`
    }
    let query = `SELECT  kps_expense.*,kps_users.username,kps_users.email FROM kps_expense LEFT JOIN kps_users ON kps_users.id = kps_expense.userId WHERE 1 = 1 ${whereCondition}`
    let queryValues = []
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        if (res.length) {
          for (let x of res) {
            x.receipt = `${process.env.Base_Url}/${x.folder_name}/${x.receipt}`
          }
        }
        resolve(res)
      }

    })

  })
}
expense.getExpenseType = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT  id,title,amount,category,created_by FROM kps_expense_type WHERE expense_id = ?`
    let queryValues = [postData.expense_id]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }

    })

  })
}
expense.getExpenseTypeImage = (postData) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT  id,path,folder_name,created_by FROM kps_expense_type_image WHERE expense_type_id = ?`
    let queryValues = [postData.expense_type_id]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        if (res.length) {
          for (let x of res) {
            x.path = `${process.env.Base_Url}/${x.folder_name}/${x.path}`
          }
        }
        resolve(res)
      }

    })

  })
}


expense.addExpense = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      userId: postData.user.userId,
      employeeName: postData.employeeName,
      startDate: postData.startDate || null,
      endDate: postData.endDate || null,
      expenditure: postData.expenditure || null,
      projectId: postData.projectId || null,
      category: postData.category || null,
      task: postData.task || null,
      receipt: postData.pdfBaseName || null,
      folder_name: postData.folder_name || null,
      mileageAmount: postData.mileageAmount || null,
      expenseAmount: postData.expenseAmount || null,
      mileageStatus: postData.mileageStatus || 'Pending',
      expenseStatus: postData.expenseStatus || 'Pending',
      createdAt: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      created_by: postData.user.userId
    }
    let query = `INSERT INTO ?? SET ?`
    let queryValues = ["kps_expense", insertedData]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
expense.addExpenseType = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      expense_id: postData.expenseId,
      title: postData.title || null,
      amount: postData.amount,
      category: postData.category || null,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      created_by: postData.userId
    }
    let query = `INSERT INTO ?? SET ?`
    let queryValues = ["kps_expense_type", insertedData]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
expense.addExpenseTypeImages = (postData) => {
  return new Promise((resolve, reject) => {
    let insertedData = {
      expense_type_id: postData.expenseTypeId,
      path: postData.url || null,
      folder_name: postData.folder_name,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      created_by: postData.userId
    }
    let query = `INSERT INTO ?? SET ?`
    let queryValues = ["kps_expense_type_image", insertedData]
    db.query(query, queryValues, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
expense.updateExpenseMileageStatus = (postData) => {
  return new Promise((resolve, reject) => {
    let updatedValues = {
      [postData.key]: postData.status || "Pending",
      updatedAt: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      updated_by: postData.userId
    }
    let query = `UPDATE ?? SET ? WHERE id = ?`
    let values = ['kps_expense', updatedValues, postData.userId]
    db.query(query, values, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

module.exports = expense