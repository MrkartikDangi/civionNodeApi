const Logo = require("../../models/logoModel");
const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");
const path = require("path");
const db = require("../../config/db")

exports.getLogoList = async (req, res) => {
  try {
    const logos = await Logo.getLogosList(req.body);
    let result = [];
    if (logos) {
      result = logos.map((x) => {
        x.file_url = `${process.env.Base_Url}/${x.folder_name}/${x.logoUrl}`;
        return x;
      });
    }
    return generic.success(req, res, {
      message: "logos list.",
      data: result,
    });
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "something went wrong!",
    });
  }
};
exports.addLogo = async (req, res) => {
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
    const { companyName, fileUrl } = req.body;
    let logoUrl = path.basename(fileUrl);
    let folder_name = path.dirname(fileUrl);
    const newLogo = await Logo.addLogos({ companyName, folder_name, logoUrl });
    if (newLogo.insertId) {
      db.commit()
      return generic.success(req, res, {
        message: "logo is successfully added.",
        data: {
          id: newLogo.insertId
        }
      });
    } else {
      db.rollback()
      return generic.error(req, res, {
        message: "failed to add logo",
      });
    }
  } catch (error) {
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "something went wrong!",
    });
  }
};
