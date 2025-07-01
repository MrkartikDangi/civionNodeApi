const JobHazard = require("../../models/jobHazardModel");
const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");

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
    const {
      selectedDate,
      time,
      location,
      projectName,
      description,
      checkedItems,
      tasks,
      workers,
      reviewedBy,
      reviewSignature,
      dateReviewed,
    } = req.body;

    const data = await JobHazard.create({
      selectedDate,
      time,
      location,
      projectName,
      description,
      checkedItems,
      tasks,
      workers,
      reviewedBy,
      reviewSignature,
      dateReviewed,
    });
    return generic.success(req, res, {
      message: "Job Hazard data submitted successfully.",
      data: {
        selectedDate,
        time,
        location,
        projectName,
        description,
        checkedItems: checkedItems || [],
        tasks: tasks || [],
        workers,
        reviewedBy,
        reviewSignature,
        dateReviewed,
      },
    });
  } catch (error) {
    return generic.error(req, res, {
      message: "Error creating job hazard.",
      details: error.message,
    });
  }
};
