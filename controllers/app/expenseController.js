const path = require("path");
const fs = require("fs"); // Import the file system module
const handlebars = require("handlebars");
const mileage = require("../../models/mileageModel");
const expense = require("../../models/expenseModel");
const generic = require("../../config/genricFn/common");
const db = require("../../config/db")
const { validationResult, matchedData } = require("express-validator");

exports.addExpense = async (req, res) => {
  try {
    db.beginTransaction()
    const mileageUser = await mileage.getUserMileage({ filter: { userId: req.body.user.userId, startDate: req.body.startDate, endDate: req.body.endDate, append_to_expense: 0 } });
    if (!mileageUser) {
      req.body.mileageExpense = 0
    } else {
      req.body.mileageExpense = mileageUser.reduce((sum, trip) => sum + trip.amount, 0)
    }
    req.body.expenseAmount = req.body.expenseType.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0,
    );
    req.body.pdfBaseName = path.basename(req.body.receipt);
    req.body.folder_name = path.dirname(req.body.receipt);
    const addExpense = await expense.addExpense(req.body)
    if (addExpense.insertId) {
      const expenseId = addExpense.insertId
      if (req.body.expenseType && req.body.expenseType.length) {
        for (let row of req.body.expenseType) {
          row.expenseId = expenseId
          row.dateTime = req.body.user.dateTime
          row.userId = req.body.user.userId
          const addExpenseType = await expense.addExpenseType(row)
          if (addExpenseType.insertId && row.images.length) {
            for (let x of row.images) {
              x.expenseTypeId = addExpenseType.insertId
              x.url = path.basename(x.path)
              x.folder_name = path.dirname(x.path)
              x.dateTime = req.body.user.dateTime
              x.userId = req.body.user.userId
              await expense.addExpenseTypeImages(x)
            }
          }
        }
      }
      if (mileageUser.length) {
        for (let row of mileageUser) {
          await mileage.updateMileageAppendStatus({ id: row.id, dateTime: req.body.user.dateTime })
        }
      }
      db.commit()
      return generic.success(req, res, {
        message: "Expense successfully created",
        data: {
          expenseId: addExpense.insertId
        },
      });
    } else {
      db.rollback()
      return generic.success(req, res, {
        message: "Failed to create expense",
      });

    }

  } catch (error) {
    console.log('errror', error)
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "something went wrong!",
    });
  }
};
exports.getExpense = async (req, res) => {
  try {
    if (!req.body.user.isBoss) {
      req.body.filter.userId = req.body.user.userId
    }
    const getExpenseData = await expense.getExpenseData(req.body)
    if (getExpenseData && getExpenseData.length) {
      for (let row of getExpenseData) {
        row.expenseType = await expense.getExpenseType({ expense_id: row.id })
        if (row.expenseType.length) {
          for (let element of row.expenseType) {
            element.images = await expense.getExpenseTypeImage({ expense_type_id: element.id })
          }
        }
      }
    }
    return generic.success(req, res, {
      message: "Expense list.",
      data: getExpenseData,
    });
  } catch (error) {
    console.log('error', error)
    return generic.error(req, res, {
      status: 500,
      message: "something went wrong!",
    });
  }
};
exports.getPendingApprovalList = async (req, res) => {
  try {
    const pendingApprovals = await ExpenseInfo.find({
      $or: [{ mileageStatus: "Pending" }, { expenseStatus: "Pending" }],
    }).populate("submittedBy", "username email");

    return generic.success(req, res, {
      message: "pending approval list.",
      data: pendingApprovals,
    });
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "something went wrong!",
    });
  }
};
exports.expenseApprove = async (req, res) => {
  try {
    const { type, status } = req.body;
    const validTypes = ["mileage", "expense"];
    const validStatuses = ["Pending", "Approved", "Rejected"];

    if (!validTypes.includes(type) || !validStatuses.includes(status)) {
      return generic.error(req, res, {
        message: `Invalid data provided.`
      });
    }
    const data = {
      expense_id: req.body.expense_id,
      userId: req.body.user.userId,
      dateTime: req.body.user.dateTime,
      key: [`${type}Status`],
      status: req.body.status
    };
    const updateExpenseMileageStatus = await expense.updateExpenseMileageStatus(data)
    const getUpdatedExpense = await expense.getExpenseData({ filter: { expense_id: req.body.expense_id } })
    if (updateExpenseMileageStatus.affectedRows) {
      if (req.body.user.isBoss && status == "Approved") {
        const emailTemplatePath = path.join(
          __dirname,
          "../../view/payrollEmailTemplate.html",
        );
        const emailTemplateSource = fs.readFileSync(emailTemplatePath, "utf8");
        const emailTemplate = handlebars.compile(emailTemplateSource);
        let type = req.body.type.charAt(0).toUpperCase() + req.body.type.slice(1);
        const getUpdatedExpenseType = await expense.getExpenseType({ expense_id: req.body.expense_id })
        let getExpenseTypeImages
        if (getUpdatedExpenseType.length) {
          getExpenseTypeImages = await expense.getExpenseTypeImage({ expense_type_id: getUpdatedExpenseType[0]?.id })

        }

        const emailData = {
          type: type,
          employeeName: getUpdatedExpense[0]?.username,
          totalApprovedAmount: req.body.type == 'expense' ? getUpdatedExpense[0]?.expenseAmount.toFixed(2) : getUpdatedExpense[0]?.mileageAmount.toFixed(2),
          startDate: getUpdatedExpense[0]?.startDate.toLocaleDateString("en-US"),
          endDate: getUpdatedExpense[0]?.endDate.toLocaleDateString("en-US"),
          images: req.body.type == 'expense' && getExpenseTypeImages.length > 0 ? getExpenseTypeImages : [],
        };

        const emailHTML = emailTemplate(emailData);

        let result = await generic.sendApprovalEmail(
          "kpdangi660@gmail.com",
          `${type} Report Approved`,
          emailHTML,
        );
        if (result) {
          return generic.success(req, res, {
            message: `User ${type} is approved.`,
            data: getUpdatedExpense,
          });

        } else {
          return generic.success(req, res, {
            message: `failed to send ${type} mail.`,
            data: getUpdatedExpense,
          });
        }

      }
      return generic.success(req, res, {
        message: `User ${type} is approved.`,
        data: getUpdatedExpense,
      });

    } else {
      return generic.error(req, res, {
        message: `Failed to approved user ${type}.`,
      });

    }
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "something went wrong!",
    });
  }
};
exports.updateExpenseItemStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    db.beginTransaction()
    if (req.body.type == 'expense') {
      const updateExpenseItemStatus = await expense.updateExpenseItemStatus(req.body)
      if (updateExpenseItemStatus.affectedRows) {
        const data = {
          expense_id: req.body.expense_id,
          userId: req.body.user.userId,
          dateTime: req.body.user.dateTime,
          key: 'expenseStatus',
          status: req.body.status || 'Approved'
        };
        await expense.updateExpenseMileageStatus(data)
        db.commit()
        return generic.success(req, res, {
          message: req.body.item_id !== "" ? "Item status updated successfully" : "Expense status updated successfully",
        });
      } else {
        db.rollback()
        return generic.error(req, res, {
          message: "Failed to update item status",
        });
      }
    } else {
      const data = {
        expense_id: req.body.expense_id,
        userId: req.body.user.userId,
        dateTime: req.body.user.dateTime,
        key: 'mileageStatus',
        status: req.body.status || 'Approved'
      };
      let result = await expense.updateExpenseMileageStatus(data)
      if (result.affectedRows) {
        if (data.status == 'Approved') {
          let result = await generic.sendExpenseMileageMail({ expense_id: req.body.expense_id, type: req.body.type })
          if (result) {
            db.commit()
            return generic.success(req, res, {
              message: result.message,
            });

          } else {
            db.rollback()
            return generic.success(req, res, {
              message: result.message,
            });
          }
        } else {
          db.commit()
          return generic.success(req, res, {
            message: "Mileage status updated successfully",
          });
        }
      } else {
        db.rollback()
        return generic.error(req, res, {
          message: "Failed to update mileage status",
        });
      }

    }

  } catch (error) {
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "something went wrong!",
    });
  }
};
