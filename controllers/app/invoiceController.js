const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");
const {
  invoiceReportTemplate,
} = require("../../utils/pdfHandlerNew/htmlHandler");
const Project = require("../../models/projectModel");
const Invoice = require("../../models/InvoiceModel");
const ExcelJS = require("exceljs");
const path = require("path");
const moment = require("moment");
const fs = require("fs");

exports.getInvoiceData = async (req, res) => {
  try {
    const { invoiceId } = req.query;
    let result;

    if (invoiceId) {
      result = await Invoice.findById(invoiceId)
        .populate([
          {
            path: "projectId",
          },
          {
            path: "userDetails.userId",
            select: "-password",
          },
        ])
        .lean();

      if (!result) {
        return generic.error(req, res, { message: "Invoice not found" });
      }
      result.userDetails = result.userDetails.map((detail) => {
        detail = {
          ...detail.userId,
          ...detail,
          userId: detail.userId._id,
          _id: undefined,
          __v: undefined,
        };
        return detail;
      });
      result = {
        ...result,
        invoiceId: result._id,
        projectId: result.projectId?._id,
        __v: undefined,
        _id: undefined,
      };
    } else {
      result = await Invoice.find()
        .populate("projectId userDetails.userId")
        .lean();
      result = result.map((invoice) => ({
        ...invoice,
        invoiceId: invoice._id,
        projectId: invoice.projectId?._id,
        userDetails: invoice.userDetails.map((user) => ({
          ...user,
          userId: user.userId?._id,
          userName: user.userId?.username || user.userName,
          _id: undefined,
        })),
        _id: undefined,
        __v: undefined,
      }));
    }

    return generic.success(req, res, {
      message: "Invoices fetched successfully",
      data: result,
    });
  } catch (error) {
    return generic.error(req, res, {
      message: "failed to fetch invoice details",
      details: error.message,
    });
  }
};

exports.createInvoice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    const {
      clientName,
      fromDate,
      toDate,
      invoiceTo,
      projectId,
      clientPOReferenceNumber,
      description,
      userDetails,
      totalBillableHours,
      subTotal,
      totalAmount,
    } = req.body;

    let { status, project, message } = await generic.validateReferences({
      projectId,
    });
    if (!status) {
      return generic.validationError(req, res, { message });
    }

    const newInvoice = await Invoice.create({
      clientName,
      fromDate,
      toDate,
      invoiceTo,
      projectId,
      clientPOReferenceNumber,
      description,
      userDetails,
      totalBillableHours,
      subTotal,
      totalAmount,
    });
    return generic.success(req, res, {
      message: "Invoice created successfully.",
      data: newInvoice,
    });
  } catch (error) {
    return generic.error(req, res, {
      message: "Error creating invoice.",
      details: error.message,
    });
  }
};

exports.generateInvoiceExcel = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    const isBoss = req.user.isBoss;
    if (isBoss) {
      // const invoiceDateMoment = moment.utc(req.body.invoiceDate);
      // const startOfDay = invoiceDateMoment.startOf('day').toDate();
      // const endOfDay = invoiceDateMoment.endOf('day').toDate();
      const data = await Invoice.find({
        createdAt: {
          $gte: req.body.fromDate,
          $lte: req.body.toDate,
        },
      });
      if (data && data.length) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("KPS Monthly Invoicing Summary");

        const maxUserDetailsLength = Math.max(
          ...data.map((item) => item.userDetails.length),
        );
        const colLength = 5 + maxUserDetailsLength * 5;

        sheet.columns = Array(colLength + 2).fill({ width: 25 });

        const offset = 1;
        const startCharCode = 65 + offset;
        const startCol = String.fromCharCode(startCharCode);
        const nextCol = String.fromCharCode(startCharCode + 1);
        const endCol = String.fromCharCode(startCharCode + colLength - 1);

        sheet.mergeCells(`${startCol}2:${endCol}2`);
        sheet.getCell(`${startCol}2`).value = "KPS Monthly Invoicing Summary";
        sheet.getCell(`${startCol}2`).font = { size: 14, bold: true };
        sheet.getCell(`${startCol}2`).alignment = {
          horizontal: "left",
          vertical: "left",
        };

        const from = moment(req.body.fromDate).format("MMM-D-YYYY");
        const to = moment(req.body.toDate).format("MMM-D-YYYY");

        sheet.mergeCells(`${startCol}3:${startCol}4`);
        sheet.getCell(`${startCol}3`).value = "Invoiced duration:";
        sheet.getCell(`${startCol}3`).font = { size: 10, bold: true };
        sheet.getCell(`${startCol}3`).alignment = {
          horizontal: "left",
          vertical: "middle",
        };

        sheet.mergeCells(`${nextCol}3:${endCol}4`);
        sheet.getCell(`${nextCol}3`).value = `${from} to ${to}`;
        sheet.getCell(`${nextCol}3`).alignment = {
          horizontal: "left",
          vertical: "middle",
        };

        const uniqueUserNames = [
          ...new Set(
            data.flatMap((item) =>
              item.userDetails.map((user) => user.userName),
            ),
          ),
        ];

        // Table Header
        const tableHeader = [
          "S.no",
          "Client",
          "Invoice To",
          "Project Name",
          "Project Number",
          "KPS Billing Description on Invoice",
          ...uniqueUserNames, 
          "totalBillableHours",
          "rate",
          "subTotal",
          "total",
        ];
        const headerRow = sheet.addRow(tableHeader);

        headerRow.eachCell((cell, colNumber) => {
          const isNonEmpty = cell.value !== undefined && cell.value !== "";

          if (isNonEmpty) {
            cell.font = { bold: true };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFD9D9D9" },
            };

            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            };
          }
        });

        sheet.getColumn(7).width = 50;
        const totalHoursByUser = uniqueUserNames.map(() => 0);
        for (let i = 0; i < data.length; i++) {
          const invoice = data[i];
          const project = await Project.findById(invoice.projectId);
          const dataRow = [
            i + 1,
            invoice.clientName,
            invoice.invoiceTo,
            project ? project.projectName : "Unknown Project",
            invoice.clientPOReferenceNumber,
            invoice.description,
          ];

          uniqueUserNames.forEach((userName, index) => {
            const user = invoice.userDetails.find(
              (u) => u.userName === userName,
            );
            const totalHours = user ? user.totalHours : 0;
            dataRow.push(totalHours);

            totalHoursByUser[index] += totalHours;
          });

          const summary = invoice.userDetails[0];
          dataRow.push(
            invoice.totalBillableHours,
            summary.rate,
            invoice.subTotal,
            invoice.totalAmount,
          );

          const row = sheet.addRow(dataRow);

          // const descriptionColIndex = 7;
          // const charCount = invoice.description ? invoice.description.length : 0;
          // const wrapCharsPerLine = 45;
          // const lineCount = Math.ceil(charCount / wrapCharsPerLine);
          // const estimatedHeight = Math.max(25, lineCount * 20);

          // row.height = estimatedHeight;

          // const descriptionCell = row.getCell(descriptionColIndex);
          // descriptionCell.alignment = {
          //     wrapText: true,
          //     vertical: 'top',
          //     horizontal: 'left'
          // };

          // descriptionCell.border = {
          //     top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          //     left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          //     bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          //     right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
          // };
          // row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          //     if (colNumber !== descriptionColIndex) {
          //         cell.alignment = { horizontal: 'right', vertical: 'middle' };
          //     }
          // });
        }

        const totalRow = sheet.addRow([
          "",
          "",
          "",
          "",
          "",
          "",
          ...totalHoursByUser,
          "",
          "",
          "",
          "",
        ]);

        totalRow.font = { bold: true };
        let dates = {
          formattedFromDate: moment(req.body.fromDate).format("DD-MMM-YYYY"),
          formattedToDate: moment(req.body.toDate).format("DD-MMM-YYYY"),
        };

        const buffer = await workbook.xlsx.writeBuffer();
        let Maildata = {
          to: "aasthasharma30.97@gmail.com",
          cc: "",
          bcc: "",
          subject: `Invoice Report`,
          html: invoiceReportTemplate(dates),
          attachments: [
            {
              filename: "invoice.xlsx",
              content: buffer,
              contentType:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
          ],
        };

        let result = await generic.sendEmails(Maildata);
        if (result) {
          return generic.success(req, res, {
            status: 200,
            message: `The invoice report has been successfully generated and sent via email`,
          });
        }
        // let base64Excel = buffer.toString('base64')
        // return generic.success(req, res, {
        //     message: "Invoice excel.",
        //     data: base64Excel
        // })

        // res.setHeader('Content-Disposition', 'attachment; filename=Invoice_Summary.xlsx');
        // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // res.send(buffer);
      } else {
        return generic.success(req, res, {
          status: 200,
          message: `No invoice is generated from ${moment(req.body.fromDate).format("DD-MMM-YYYY")} to ${moment(req.body.toDate).format("DD-MMM-YYYY")}.`,
          data: data,
        });
      }
    } else {
      return generic.error(req, res, {
        message: "You are not allowed to generate excel!",
      });
    }
  } catch (error) {
    return generic.error(req, res, {
      message: "Error creating invoice.",
      details: error.message,
    });
  }
};
