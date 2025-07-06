const JobHazard = require("../../models/jobHazardModel");
const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");
const db = require("../../config/db")

exports.getJobHazardData = async (req, res) => {
  try {
    const data = await JobHazard.find();
    return generic.success(req, res, {
      message: "Job Hazard data retrieved successfully.",
      data: data,
    });
  } catch (error) {
    return generic.error(req, res, {
      message: "Error getting job hazard data",
      details: error.message,
    });
  }
};

exports.createJobHazard = async (req, res) => {
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
    const addJobHazardData = await JobHazard.addJobHazardData(req.body)
    if (addJobHazardData.insertId) {
      // if(req.body.){

      // }
      db.commit()
      return generic.success(req, res, {
        message: "Job Hazard data submitted successfully.",
        data: {
          id: addJobHazardData.insertId
        },
      });

    } else {
      db.rollback()
      return generic.error(req, res, {
        message: "Job Hazard data submitted successfully.",
      });

    }

  } catch (error) {
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong.",
    });
  }
};
