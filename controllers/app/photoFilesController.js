const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");
const PhotoFiles = require("../../models/photoFileModel");
const Project = require("../../models/projectModel");
const moment = require("moment");
const path = require("path");
const db = require("../../config/db")


exports.uploadAttachement = async (req, res) => {
  try {
    if (
      req.files &&
      req.files.file &&
      Array.isArray(req.files.file) &&
      req.files.file.length > 0
    ) {

      let data = {
        fileData: req.files.file,
        type: req.body.type,
      };
      let result = await generic.uploadAttachment(data);
      if (result.status) {
        generic.success(req, res, {
          message: result.message,
          data: result.result,
        });
      } else {
        generic.error(req, res, { message: result.message });
      }
    } else {
      generic.error(req, res, {
        message: "Please provide image for uploadation",
      });
    }
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};

exports.deleteAttachemnts = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    let path = req.body.path;
    const s3DeleteResult = await generic.deleteAttachmentFromS3(path);
    if (s3DeleteResult?.status) {
      generic.success(req, res, { message: s3DeleteResult.message });
    } else {
      generic.error(req, res, { message: s3DeleteResult.message });
    }
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};

exports.getPhotoFiles = async (req, res) => {
  try {
    const data = await PhotoFiles.getPhotoFilesData(req.body);
    return generic.success(req, res, {
      message: "photofiles data retrieved successfully.",
      data: data,
    });
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.getPhotoFilesByUserId = async (req, res) => {
  try {
    const photos = await PhotoFiles.getPhotoFilesData({ filter: { userId: req.body.user.userId } });
    let data = [];
    if (photos && photos.length > 0) {
      data = photos.map((x) => {
        x.file_url = `${process.env.Base_Url}/${x.folder_name}/${x.file_url}`;
        return x;
      });
    }
    return generic.success(req, res, {
      message: "photofiles data retrieved successfully.",
      data: data,
    });
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.createPhotoFiles = async (req, res) => {
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
    if (req.body.imageurl && req.body.imageurl.length) {
      for (let row of req.body.imageurl) {
        row.schedule_id = req.body.schedule_id
        row.userId = req.body.user.userId
        row.fileName = path.basename(row.path);
        row.folder_name = path.dirname(row.path);
        await PhotoFiles.addPhotoFileData(row)
      }
      db.commit()
      return generic.success(req, res, {
        message: "Photofiles added successfully",
      });
    } else {
      db.rollback()
      return generic.error(req, res, {
        message: `Provide image for uploadation`
      });

    }
  } catch (error) {
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.deletePhotoFiles = async (req, res) => {
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
    const checkImageExists = await PhotoFiles.getPhotoFilesData({ filter: { id: req.body.id } });

    if (!checkImageExists.length) {
      db.rollback()
      return generic.error(req, res, {
        message: "Image doesn't exist",
        details: checkImageExists,
      });
    }

    const dbDeleteResult = await PhotoFiles.deletePhotoFiles(req.body);
    if (dbDeleteResult.affectedRows) {
      let fileUrl = `${checkImageExists[0].folder_name}/${checkImageExists[0].file_url}`;
      const s3DeleteResult = await generic.deleteAttachmentFromS3(fileUrl);
      if (!s3DeleteResult?.status) {
        db.rollback()
        return generic.error(req, res, {
          message: "Image deleted from DB, but failed to delete from S3",
        });
      }
      db.commit()
      return generic.success(req, res, {
        message: "Image successfully deleted",
      });

    } else {
      db.rollback()
      return generic.error(req, res, {
        message: "Failed to delete image from database",
        details: dbDeleteResult,
      });

    }

  } catch (error) {
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
