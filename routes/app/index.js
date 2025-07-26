const express = require("express");
const router = express.Router();
const { authenticateJWT, isBoss } = require("../../config/auth");
const { check, oneOf } = require("express-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dailyDiaryController = require("../../controllers/app/dailyDiaryController");
const dailyEntryController = require("../../controllers/app/dailyEntryController");
const expenseController = require("../../controllers/app/expenseController");
const invoiceController = require("../../controllers/app/invoiceController");
const jobHazardController = require("../../controllers/app/jobHazardController");
const locationWeatherController = require("../../controllers/app/locationWeatherController");
const photoFileController = require("../../controllers/app/photoFilesController");
const projectController = require("../../controllers/app/projectController");
const weeklyEntryController = require("../../controllers/app/weeklyEntryController");
const logoController = require("../../controllers/app/logoController");
const userController = require("../../controllers/app/userController");
const scheduleController = require("../../controllers/app/schedulesController");
const mileageController = require("../../controllers/app/mileageController");
const notificationController = require("../../controllers/app/notificationController");
const drawingController = require("../../controllers/app/drawingController")
const generic = require("../../config/genricFn/common")

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
  }
}
// Define storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let directoryType = "uploads";
    let uploadDir = path.join(__dirname, `../../${directoryType}/`);
    ensureDirExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file) {
    return cb(new Error("File not provided!"), false);
  }
  const isImage = file.mimetype.startsWith("image/");
  const isPDF = file.mimetype === "application/pdf";

  if (isImage || isPDF) {
    cb(null, true);
  } else {
    return cb(new Error("Only image and PDF files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit to 5 MB
  },
});

// function to initialize onedrive 
(callOneDrive = async () => {
  await generic.initializeOneDrive();
})
callOneDrive()

router.post("/projects/schedules",
  oneOf([
    [
      check("projectId", "projectId is required").notEmpty(),
    ],
  ]),
  authenticateJWT, projectController.schedules);
router.post("/projects/remove",
  oneOf([
    [
      check("projectId", "projectId is required").notEmpty(),
    ],
  ]), authenticateJWT, projectController.delete);
router.post("/projects/addProjectData",
  oneOf([
    [
      check("projectName", "projectName is required").notEmpty(),
      check("projectNumber", "projectNumber is required").notEmpty(),
      check("owner", "owner is required").notEmpty(),
      check("startDate", "startDate is required").notEmpty(),
      check("endDate", "endDate is required").notEmpty(),
    ],
  ]), authenticateJWT, projectController.addProjectData);

router.post(
  "/auth/register",
  oneOf([
    [
      check("email", "email is required").notEmpty(),
      check("password", "password is required").notEmpty(),
      check("username", "username is required").notEmpty(),

    ],
  ]),
  userController.registerUser,
);
router.post(
  "/auth/addUser",
  oneOf([
    [
      check("email", "email is required").notEmpty(),
      check("mileageRate", "mileageRate is required").notEmpty(),
      check("allowanceDistance", "allowanceDistance is required"),
      check("isBoss", "isBoss is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  isBoss,
  userController.addUserDetails,
);
router.post(
  "/auth/updateBossPermission",
  oneOf([
    [
      check("is_boss", "is_boss is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  userController.updateBossPermission,
);
router.post(
  "/auth/update-location",
  oneOf([
    [
      check("userId", "userId is required").notEmpty(),
      check("latitude", "latitude is required").notEmpty(),
      check("longitude", "longitude is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  userController.updateLocation,
);

router.post(
  "/auth/login",
  oneOf([
    [
      check("email", "email is required").notEmpty(),
      check("password", "password is required").notEmpty(),
    ],
  ]),
  userController.login,
);
router.post(
  "/auth/changePassword",
  oneOf([[check("currentPassword", "currentPassword is required").notEmpty()]]),
  oneOf([[check("newPassword", "newPassword is required").notEmpty()]]),
  authenticateJWT,
  userController.changePassword,
);
router.post(
  "/auth/forgot-password",
  oneOf([[check("email", "email is required").notEmpty()]]),
  userController.forgotPassword,
);
router.post(
  "/auth/verify-code",
  oneOf([
    [
      check("email", "email is required").notEmpty(),
      check("code", "code is required").notEmpty(),
    ],
  ]),
  userController.verifyCode,
);
router.post(
  "/auth/reset-password",
  oneOf([
    [
      check("email", "email is required").notEmpty(),
      check("newPassword", "newPassword is required").notEmpty(),
    ],
  ]),
  userController.resetPassword,
);
router.get("/auth/profile", authenticateJWT, userController.profile);

router.post(
  "/upload/uploadAttachment",
  authenticateJWT,
  upload.fields([{ name: "file" }]),
  photoFileController.uploadAttachement,
);
router.post(
  "/upload/deleteAttachemnts",
  oneOf([[check("path", "path is required").notEmpty()]]),
  authenticateJWT,
  photoFileController.deleteAttachemnts,
);
router.post(
  "/photos/getPhotoFiles",
  authenticateJWT,
  photoFileController.getPhotoFiles,
);
router.post(
  "/photos/getPhotoFilesByUserId",
  authenticateJWT,
  photoFileController.getPhotoFilesByUserId,
);
router.post(
  "/photos/deletePhotoFiles",
  oneOf([
    [
      check("photoFileId", "photoFileId is required").notEmpty()
    ],
  ]),
  authenticateJWT,
  photoFileController.deletePhotoFiles,
);
router.post(
  "/photos/createPhotoFiles",
  oneOf([
    [
      check("imageurl", "imageurl is required").notEmpty(),
      check("schedule_id", "schedule_id is required").notEmpty()
    ],
  ]),
  authenticateJWT,
  photoFileController.createPhotoFiles,
);

router.post(
  "/diary/getDailyDiary",
  authenticateJWT,
  dailyDiaryController.getDailyDiary,
);
// --> below
router.post(
  "/diary/createDailyDiary",
  oneOf([
    [
      check("schedule_id", "schedule_id is required").notEmpty(),
      check("selectedDate", "selectedDate is required").notEmpty(),
      check(
        "ownerProjectManager",
        "ownerProjectManager is required",
      ).notEmpty(),
      check("contractNumber", "contractNumber is required").notEmpty(),
      check("contractor", "contractor is required").notEmpty(),
      check("reportNumber", "reportNumber is required").notEmpty(),
      check("ownerContact", "ownerContact is required").notEmpty(),
      check("description", "description is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  dailyDiaryController.createDailyDiary,
);

router.post(
  "/diary/getDailyEntry",
  authenticateJWT,
  dailyEntryController.getDailyEntry,
);
//  -> below
router.post(
  "/daily/createDailyEntry",
  oneOf([
    [
      check("schedule_id", "schedule_id is required").notEmpty(),
      check("selectedDate", "selectedDate is required").notEmpty(),
      check("location", "location is required").notEmpty(),
      check("reportNumber", "reportNumber is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  dailyEntryController.createDailyEntry,
);

router.post(
  "/weekly/createWeeklyEntry",
  oneOf([
    [
      check("projectId", "projectId is required").notEmpty(),
      check("startDate", "startDate is required").notEmpty(),
      check("endDate", "endDate is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  weeklyEntryController.createWeeklyEntry,
);
router.post(
  "/weekly/getWeeklyReport",
  authenticateJWT,
  weeklyEntryController.getWeeklyReport,
);

router.get(
  "/invoices/getInvoiceList",
  authenticateJWT,
  invoiceController.getInvoiceData,
);
router.post(
  "/invoices/create-invoice",
  oneOf([
    [
      check("clientName", "clientName is required").notEmpty(),
      check("fromDate", "fromDate is required").notEmpty(),
      check("toDate", "toDate is required").notEmpty(),
      check("invoiceTo", "invoiceTo is required").notEmpty(),
      check("projectId", "projectId is required").notEmpty(),
      check("description", "description is required").notEmpty(),
      check("userDetails", "userDetails is required").notEmpty(),
      check("totalBillableHours", "totalBillableHours is required").notEmpty(),
      check("subTotal", "subTotal is required").notEmpty(),
      check("totalAmount", "totalAmount is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  invoiceController.createInvoice,
);
router.post(
  "/invoices/generateInvoiceExcel",
  oneOf([
    [
      check("fromDate", "fromDate is required").notEmpty(),
      check("toDate", "toDate is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  invoiceController.generateInvoiceExcel,
);

router.post(
  "/jobHazard/getJobHazard",
  authenticateJWT,
  jobHazardController.getJobHazardData,
);
router.post(
  "/jobHazard/saveJobHazard",
  oneOf([
    [
      check("WorkerName", "WorkerName is required").notEmpty(),
      check("selectedDate", "selectedDate is required").notEmpty(),
      check("time", "time is required").notEmpty(),
      check("location", "location is required").notEmpty(),
      check("projectName", "projectName is required").notEmpty(),
      check("description", "description is required").notEmpty(),
      check("selectedActivities", "selectedActivities is required").notEmpty(),
      check("siteOrientationChecked", "siteOrientationChecked is required").notEmpty(),
      check("tasks", "tasks is required").notEmpty(),
      check("toolBoxMeetingChecked", "toolBoxMeetingChecked is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  jobHazardController.createJobHazard,
);

router.post("/logos/getLogo", authenticateJWT, logoController.getLogoList);
router.post(
  "/logos/addLogo",
  oneOf([
    [
      check("companyName", "companyName is required").notEmpty(),
      check("fileUrl", "fileUrl is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  logoController.addLogo,
);
router.post(
  "/logos/editLogo",
  oneOf([
    [
      check("companyName", "companyName is required").notEmpty(),
      check("fileUrl", "fileUrl is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  logoController.editLogo,
);
router.post(
  "/logos/deleteLogo",
  oneOf([
    [
      check("id", "id is required").notEmpty()
    ],
  ]),
  authenticateJWT,
  logoController.deleteLogo,
);

router.post(
  "/expense/getExpense",
  authenticateJWT,
  expenseController.getExpense,
);
router.post(
  "/expense/addExpense",
  authenticateJWT,
  expenseController.addExpense,
);
router.get(
  "/expense/approvals",
  authenticateJWT,
  isBoss,
  expenseController.getPendingApprovalList,
);
router.post(
  "/expense/approve",
  authenticateJWT,
  isBoss,
  expenseController.expenseApprove,
);
router.post(
  "/expense/updateExpenseItemStatus",
   oneOf([
    [
      check("expense_id", "expense_id is required").notEmpty(),
      check("status", "status is required").notEmpty(),
      check("type", "type is required").notEmpty(),
      check("items", "items is required"),
      check("mileage", "mileage is required"),
    ],
  ]),
  authenticateJWT,
  isBoss,
  expenseController.updateExpenseItemStatus,
);

router.post(
  "/location/getLocationAndWeather",
  oneOf([
    [
      check("latitude", "latitude is required").notEmpty(),
      check("longitude", "longitude is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  locationWeatherController.getLocationWeather,
);
router.post(
  "/schedules/getScheduleData",
  authenticateJWT,
  scheduleController.getScheduleData,
);
router.post(
  "/schedules/addScheduleData",
  oneOf([
    [
      check("project_name", "project_name is required").notEmpty(),
      check("project_number", "project_number is required").notEmpty(),
      check("pdfUrl", "projectName is required").notEmpty(),
      check("rate", "rate is required").notEmpty(),
      check("invoice_to", "invoice_to is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  isBoss,
  scheduleController.addScheduleData,
);
router.post(
  "/schedules/updateScheduleData",
  oneOf([
    [
      check("project_name", "project_name is required").notEmpty(),
      check("project_number", "project_number is required").notEmpty(),
      check("pdfUrl", "projectName is required").notEmpty(),
      check("rate", "rate is required").notEmpty(),
      check("invoice_to", "invoice_to is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  isBoss,
  scheduleController.updateScheduleData,
);
router.post(
  "/schedules/deleteScheduleData",
  oneOf([
    [
      check("id", "id is required").notEmpty(),
    ],
  ]),
  authenticateJWT,
  isBoss,
  scheduleController.deleteScheduleData,
);

router.post(
  "/mileage/addUserMileage",
  oneOf([
    [
      check("startLocation", "startLocation is required").notEmpty(),
      check("endLocation", "endLocation is required").notEmpty(),
      check("distance", "distance is required").notEmpty(),
      check("duration", "duration is required").notEmpty(),
      check("amount", "amount is required").notEmpty(),
      check("date", "date is required").notEmpty(),
      check("coords", "coords is required").notEmpty()
    ],
  ]),
  authenticateJWT,
  mileageController.addUserMileage,
);
router.post(
  "/mileage/getUserMileage",
  [
    check("filter.startDate", "filter.startDate is required").notEmpty(),
    check("filter.endDate", "filter.endDate is required").notEmpty()
  ],
  authenticateJWT,
  mileageController.getUserMileage
);

router.post(
  "/notification/getNotifications",
  authenticateJWT,
  notificationController.getNotifications,
);
router.post(
  "/drawing/mergePdf",
  upload.fields([{ name: "originalPdf", maxCount: 1 }, { name: "mergingPdf", maxCount: 1 }]),
  authenticateJWT,
  drawingController.mergePdf,
);

module.exports = router;
