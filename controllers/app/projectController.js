const Project = require("../../models/projectModel");
const Schedule = require("../../models/scheduleModel");
const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");
const db = require("../../config/db")

exports.schedules = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    const result = await generic.getProjectSchedules(req.body);
    return generic.success(req, res, {
      message: "Project data fetched successfully",
      data: result,
    });
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.addProjectData = async (req, res) => {
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
    const result = await Project.addProjectData(req.body);
    if (result.insertId) {
      db.commit()
      return generic.success(req, res, {
        message: "Project data added successfully",
        data: {
          id: result.insertId
        }
      });
    } else {
      db.rollback()
      return generic.error(req, res, {
        message: "failed to add project data",
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

exports.delete = async (req, res) => {
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
    const deletedProject = await Project.deleteProject(req.body);
    if (deletedProject.affectedRows) {
      const deletedSchedules = await Schedule.deleteMany(req.body);
      if (deletedSchedules.affectedRows) {
        db.commit()
        return generic.success(req, res, {
          message: "Project and associated schedules removed successfully",
          data: {
            deletedProject,
            deletedSchedulesCount: deletedSchedules.deletedCount,
          },
        });
      } else {
        db.rollback()
        return generic.error(req, res, {
          message: "Error removing associated schedules",
        });

      }
    } else {
      db.rollback()
      return generic.error(req, res, {
        message: "Error removing project",
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
