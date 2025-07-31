const Schedule = require("../../models/scheduleModel");
const jwt = require("jsonwebtoken");
const Project = require("../../models/projectModel");
const UserDetails = require("../../models/userModel");
const WeeklyModel = require("../../models/weeklyEntryModel");
const fs = require("fs"); // Import the file system module
const handlebars = require("handlebars");
const Mileage = require("../../models/mileageModel");
const nodemailer = require("nodemailer");
require("dotenv").config();
const axios = require("axios");
const multer = require("multer");
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');
const oneDrive = require("../../models/oneDriveModel")
const onedriveConfig = require("../oneDrive");
const path = require("path");
const expense = require("../../models/expenseModel")
const {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const mileage = require("../../models/mileageModel");
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ensureUploadsFolderExists = () => {
  const uploadPath = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log("Uploads folder created at:", uploadPath);
  }
};

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsFolderExists();
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

var Generic = () => { };

Generic.deleteAttachmentFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(params);
    s3.send(command)
      .then((result) => {
        console.log(`S3 delete success:`, result);
      })
      .catch((err) => {
        console.error(`S3 delete error:`, err);
      });
    return {
      status: true,
      message: "success",
    };
  } catch (err) {
    return {
      status: false,
      message: `Something went wrong: ${err.message}`,
    };
  }
};
Generic.uploadAttachment = async (postData) => {
  try {
    let status = false;
    let message = ``;
    let uploadedData = [];
    for (let row of postData.fileData) {
      const filePath = `${row.path}`;
      const fileStream = fs.createReadStream(filePath);
      const extension = path.extname(row.originalname);
      const fileName = `${path.parse(row.originalname).name}_${Date.now()}${extension}`;
      const sanitizeFileName = `${postData.type}/${fileName}`;
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: sanitizeFileName,
        Body: fileStream,
        ContentType: row.mimetype,
      };

      const command = new PutObjectCommand(uploadParams);
      const data = await s3.send(command);
      if (data) {
        uploadedData.push({
          type: postData.type,
          fileName: fileName,
          fileUrl: `${process.env.Base_Url}${sanitizeFileName}`,
        });
        fs.unlinkSync(`${row.path}`);
        status = true;
        message = `file uploaded successfully`;
      } else {
        status = false;
        message = `failed to upload file, something went wrong!!`;
      }
    }
    return {
      status: status,
      message: message,
      result: uploadedData,
    };
  } catch (err) {
    return {
      status: false,
      message: `Something went wrong: ${err.message}`,
    };
  }
};

// Generic.validateReferences = async ({ projectId, userId, weeklyReportId }) => {
//   let project, user, weeklyData;
//   if (projectId) {
//     project = await Project.findById(projectId);
//     if (!project) {
//       return { status: false, message: "Project not found" };
//     }
//   }
//   if (userId) {
//     user = await UserDetails.findById(userId);
//     if (!user) {
//       return { status: false, message: "User not found" };
//     }
//   }
//   if (weeklyReportId) {
//     weeklyData = await WeeklyModel.findById(weeklyReportId);
//     if (!weeklyData) {
//       return { status: false, message: "Weekly Report not found" };
//     }
//   }
//   return { status: true, project, user, weeklyData };
// };

Generic.success = async (_, res, successObject) => {
  return res.status(successObject?.status || 200).json({
    status: "success",
    message: successObject?.message || "Request was successful",
    data: successObject?.data || null,
  });
};

Generic.error = (_, res, errorObject) => {
  return res.status(errorObject?.status || 401).json({
    status: "error",
    message: errorObject?.message || "Unauthorized",
    error: errorObject?.details || null,
  });
};

Generic.validationError = (_, res, validationObj) => {
  return res.status(400).json({
    status: "error",
    message: validationObj?.message || "Validation error",
    errors: validationObj?.errors || validationObj || "Invalid input data",
  });
};

Generic.fieldsMissing = (_, res, errorObject) => {
  return res.status(400).json({
    status: "error",
    message: "Missing required fields",
    errors: errorObject || "Fields are missing",
  });
};

Generic.checkMissingFields = (requiredFields, reqBody, res) => {
  const missingFields = requiredFields.filter((field) => !reqBody[field]);
  if (missingFields.length > 0) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields",
      errors: {
        missingFields: missingFields,
      },
    });
  }
  return null;
};

Generic.generateReportNumber = async () => {
  const year = new Date().getFullYear();
  const random1 = Math.floor(1000 + Math.random() * 9000);
  const random2 = uuidv4().slice(0, 4);
  return `${year}-${random1}-${random2}`;
};

Generic.prepareStorage = storage;

Generic.fetchRemoteImage = async (url) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return response.data;
};

Generic.sendPdfBuffer = ({ res, filePath, fileName = "Daily_Report.pdf" }) => {
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=${fileName}`,
  });

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on("end", () => {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting the file:", err);
      else console.log("Temporary PDF file deleted:", filePath);
    });
  });

  fileStream.on("error", (err) => {
    console.error("Error streaming the file:", err);
    res
      .status(500)
      .send({ status: "failed", message: "Error sending the PDF file." });
  });
};
Generic.sendApprovalEmail = async (to, subject, html, cc, bcc) => {
  return new Promise((resolve, reject) => {
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST_2,
      port: Number(process.env.EMAIL_PORT_2),
      secure: Number(process.env.EMAIL_PORT_2) === 465,
      auth: {
        user: process.env.EMAIL_USER_2,
        pass: process.env.EMAIL_PASS_2,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER_2,
      to,
      cc,
      bcc,
      subject,
      html,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        console.log("Email sent: " + info.response);
        resolve(true);
      }
    });
  });
};

Generic.sendEmails = (data) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: data.to,
      cc: data.cc || "",
      bcc: data.bcc || "",
      subject: data.subject,
      text: data.text || "",
      html: data.html || "",
      attachments: data.attachments || [],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        console.log("Email sent: " + info.response);
        resolve(true);
      }
    });
  });
};
Generic.generatePDF = async (htmlContent, outputPath) => {
  // const browser = await puppeteer.launch({
  //     args: ['--no-sandbox', '--disable-setuid-sandbox']
  // });
  const page = await browser.newPage();

  // Enable local file access for images
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  // Wait for images to load
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.all(
      images.map((img) => {
        if (img.complete) return;
        return new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        });
      }),
    );
  });

  // Generate PDF
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  console.log(`PDF generated at: ${outputPath}`);
  return outputPath;
};
Generic.getMileageExpense = async (userId, startDate, endDate) => {
  try {
    const mileageUser = await Mileage.getUserMileage({ filter: { userId: userId, startDate: startDate, endDate: endDate } });
    if (!mileageUser) return 0;
    return mileageUser.reduce((sum, trip) => sum + trip.amount, 0);
  } catch (error) {
    return 0;
  }
};
Generic.calculateDistance = async (origin, destination) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url);
    const data = response.data;

    if (data.status !== "OK") {
      return { error: data.error_message || "Could not calculate route" };
    }

    const route = data.routes[0].legs[0];
    const distance = Generic.parseDistance(route.distance.text);
    const polyline = data.routes[0].overview_polyline.points;

    return { distance, polyline };
  } catch (error) {
    console.error("Google Maps API Error:", error.message);
    return { error: "Route calculation failed" };
  }
};
Generic.parseDistance = async (distanceText) => {
  if (typeof distanceText !== 'string') return 0;

  const match = distanceText.match(/([\d.]+)\s*(km|m)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  if (unit === 'km') return value * 1000;
  if (unit === 'm') return value;

  return 0;
}
Generic.encodeToBase64 = async (str) => {
  const bytes = new TextEncoder().encode(str)
  return btoa(String.fromCharCode(...bytes))
}
Generic.decodeFromBase64 = async (str) => {
  const bytes = Uint8Array.from(atob(str), char => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
Generic.parseCoordinate = (value, type) => {
  try {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) throw new Error(`Invalid ${type} value: ${value}`);
    if (type === "latitude" && (num < -90 || num > 90)) {
      throw new Error(`Latitude out of range: ${num}`);
    }
    if (type === "longitude" && (num < -180 || num > 180)) {
      throw new Error(`Longitude out of range: ${num}`);
    }
    return num;

  } catch (error) {
    console.log('error', error)
  }

};
Generic.getGeoCodeResponse = async (postData) => {
  try {
    const geocodeResponse = await axios.get(
      process.env.GOOGLE_API,
      {
        params: {
          latlng: `${postData.latitude},${postData.longitude}`,
          key: process.env.GOOGLE_MAPS_API_KEY,
          language: "en",
        },
        timeout: 5000,
      },
    );
    let formattedAddress

    if (geocodeResponse.data.status === "OK") {
      const components = geocodeResponse.data.results[0].address_components;
      const city = components.find(c =>
        c.types.includes("locality")
      )?.long_name;
      formattedAddress = city;
    }
    return formattedAddress

  } catch (error) {
    console.log('error', error)

  }
}
Generic.getWeatherInfo = async (postData) => {
  try {
    const weatherResponse = await axios.get(
      process.env.WEATHER_API,
      {
        params: {
          lat: postData.latitude,
          lon: postData.longitude,
          appid: process.env.OPENWEATHER_API_KEY,
          units: "metric",
          lang: "en",
        },
        timeout: 5000,
      },
    );


    const { main, weather, wind, name } = weatherResponse.data;
    return weatherInfo = {
      location: name,
      temperature: main.temp,
      feels_like: main.feels_like,
      condition: weather[0].description,
      icon: `https://openweathermap.org/img/wn/${weather[0].icon}.png`,
      wind_speed: wind.speed,
      humidity: main.humidity,
    };
  } catch (error) {
    console.error("Weather API Error:", error.message);
  }
}
Generic.jwtVerify = (token, key) => {
  try {
    return new Promise((resolve, reject) => {
      jwt.verify(token, key, (err, user) => {
        if (err) {
          reject(err);
        }
        resolve({
          status: true,
          statusCode: 200,
          message: "Token validation successfull",
          data: {
            userDetails: user
          }
        })

      });
    })
  } catch (error) {
    throw new Error('failed to authenticate token')

  }
}
Generic.getMimeType = async (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  console.log('extension', extension)
  const mimeTypes = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}
Generic.uploadFileToOneDrive = async (filePath, fileName, folderPath = '', subFolder = '') => {
  try {
    const getAccessToken = await oneDrive.getValidOneDriveToken();
    const client = Client.init({
      authProvider: (done) => done(null, getAccessToken[0]?.access_token)
    });


    const fileContent = await axios.get(filePath, { responseType: 'arraybuffer' });
    const mimeType = Generic.getMimeType(fileName);
    const uploadPath = folderPath ? `/${folderPath}/${subFolder}/${fileName}` : `/${fileName}`;
    console.log('onedrive', onedriveConfig)

    const response = await client
      .api(`/users/${onedriveConfig.driveEmail}/drive/root:/${uploadPath}:/content`)
      .header('Content-Type', mimeType)
      .put(fileContent.data);

    return {
      success: true,
      webUrl: response.webUrl,
      id: response.id,
      name: response.name
    };
  } catch (error) {
    console.error('OneDriveModel Error:', error);
    throw error;
  }
}
Generic.initializeOneDrive = async () => {
  try {
    const existingToken = await oneDrive.getValidOneDriveToken();
    if (existingToken.length) {
      console.log('OneDrive is ready to use (using existing token)');
    } else {
      let deleteOneDriveExpiredToken = await oneDrive.deleteOneDriveExpiredToken();
      if (deleteOneDriveExpiredToken.affectedRows) {
        let result = await Generic.getAccessToken();
        if (result.status) {
          console.log('OneDrive is ready to use (generated new token)');
        } else {
          throw new Error('Failed to generate one drive auth token');
        }

      } else {
        console.log('Failed to initialize one drive')
      }

    }
  } catch (error) {
    throw new Error('Failed to initialize one drive');
  }
}
Generic.getAccessToken = async () => {
  const params = new URLSearchParams();
  params.append('client_id', onedriveConfig.clientId);
  params.append('scope', onedriveConfig.scopes.join(' '));
  params.append('client_secret', onedriveConfig.clientSecret);
  params.append('grant_type', 'client_credentials');

  try {
    const response = await axios.post(onedriveConfig.authUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    let result = await oneDrive.saveOneDriveToken(response.data);
    if (result.insertId) {
      return { status: true, message: `OneDrive token Successfully generated` }
    } else {
      return { status: false, message: `Failed to generate one drive auth token` }
    }
  } catch (error) {
    console.error('AuthService Error:', error.response?.data || error.message);
    throw new Error('Failed to get access token');
  }
}
Generic.mergePdf = async (postData) => {
  try {

  } catch (error) {

  }
}
Generic.sendExpenseMileageMail = async (postData) => {
  try {
    const emailTemplatePath = path.join(
      __dirname,
      "../../view/payrollEmailTemplate.html",
    );
    const emailTemplateSource = fs.readFileSync(emailTemplatePath, "utf8");
    const emailTemplate = handlebars.compile(emailTemplateSource);
    let type = postData.type.charAt(0).toUpperCase() + postData.type.slice(1);
    let emailData = {
      type: type
    }
    let getExpenseTypeImages
    let getExpenseType
    let getMileageDetails
    let getExpenseDetails = await expense.getExpenseData({ filter: { expense_id: postData.expense_id } })
    let images = []
    if (postData.type == 'expense' && postData.item_id !== "") {
      getExpenseType = await expense.getExpenseType({ filter: { id: postData.item_id, status: 'Approved' } })
      if (getExpenseType.length) {
        emailData.employeeName = getExpenseType[0]?.username
        emailData.totalApprovedAmount = getExpenseType.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)
        getExpenseTypeImages = await expense.getExpenseTypeImage({ filter: { expense_type_id: getExpenseType.map((x) => x.id).join(",") } })
        emailData.startDate = getExpenseDetails.length ? moment.utc(getExpenseDetails[0]?.startDate).format("DD-MMM-YYYY") : ''
        emailData.endDate = getExpenseDetails.length ? moment.utc(getExpenseDetails[0]?.endDate).format("DD-MMM-YYYY") : ''
        emailData.images = getExpenseTypeImages.length ? getExpenseTypeImages.map((x) => ({ path: x.file_url })) : []
      }
    }
    // if (postData.type == 'expense' && postData.item_id == "") {
    //   emailData.employeeName = getExpenseDetails.length ? getExpenseDetails[0]?.username : ''
    //   emailData.totalApprovedAmount = getExpenseDetails.length ? getExpenseDetails[0]?.expenseAmount.toFixed(2) : 0
    //   emailData.startDate = getExpenseDetails.length ? getExpenseDetails[0]?.startDate.toLocaleDateString("en-US") : ''
    //   emailData.endDate = getExpenseDetails.length ? getExpenseDetails[0]?.endDate.toLocaleDateString("en-US") : ''
    //   getExpenseType = await expense.getExpenseType({ expense_id: postData.expense_id })
    //   if (getExpenseType.length) {
    //     for (let row of getExpenseType) {
    //       getExpenseTypeImages = await expense.getExpenseTypeImage({ expense_type_id: row.id })
    //       images = getExpenseTypeImages.map(item => ({
    //         path: item.file_url
    //       }))

    //     }
    //   }
    //   emailData.images = images

    // }
    if (postData.type == 'mileage' && postData.mileage_id !== "") {
      getMileageDetails = await mileage.getUserMileage({ filter: { mileage_ids: postData.mileage_id, status: 'Approved' } })
      if (getMileageDetails.length) {
        emailData.employeeName = getMileageDetails[0]?.username || ''
        emailData.totalApprovedAmount = getMileageDetails.reduce((sum, trip) => sum + trip.amount, 0).toFixed(2) || 0
        emailData.startDate = getExpenseDetails.length ? moment.utc(getExpenseDetails[0]?.startDate).format("DD-MMM-YYYY") : ''
        emailData.endDate = getExpenseDetails.length ? moment.utc(getExpenseDetails[0]?.endDate).format("DD-MMM-YYYY") : ''
        emailData.images = images
      }

    }

    // if (postData.type == 'mileage' && postData.mileage_id == "") {
    //   emailData.employeeName = getExpenseDetails.length ? getExpenseDetails[0]?.username : ''
    //   emailData.totalApprovedAmount = getExpenseDetails.length ? getExpenseDetails[0]?.mileageAmount.toFixed(2) : 0
    //   emailData.startDate = getExpenseDetails.length ? getExpenseDetails[0]?.startDate.toLocaleDateString("en-US") : ''
    //   emailData.endDate = getExpenseDetails.length ? getExpenseDetails[0]?.endDate.toLocaleDateString("en-US") : ''
    //   emailData.images = images
    // }

    const emailHTML = emailTemplate(emailData);

    let result = await Generic.sendApprovalEmail(
      "aasthasharma30.97@gmail.com",
      `${type} Report Approved`,
      emailHTML,
      "kanhaiyalalverma686@gmail.com",
      "Faizahmadofficial293@gmail.com"
    );
    if (result) {
      return {
        status: true,
        message: `User ${type} is approved.`,
      }

    } else {
      return {
        status: false,
        message: `failed to send ${type} mail.`,
      }
    }

  } catch (error) {
    console.log('error', error)
    throw new Error('Failed to send expense mileage mail', error);

  }

}



module.exports = Generic;
