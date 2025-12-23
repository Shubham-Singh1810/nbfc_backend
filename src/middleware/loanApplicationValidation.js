const pdApplicationValidation = async (req, res, next) => {
  try {
    const { processingStatus } = req.body;
    if (!processingStatus) {
        return res.status(400).json({
          status: "error",
          message: `Processing status is missing`,
        });
      }
    if (processingStatus == "checkEligibility") {
      const { step } = req.body;
      if (!step) {
        return res.status(400).json({
          status: "error",
          message: `Step is missing`,
        });
      }
      if (step == 1) {
        const {
          fullName,
          email,
          dob,
          gender,
          educationQ,
          maritalStatus,
          userId,
          step
        } = req.body;
        const requiredFields = {
          fullName,
          email,
          dob,
          gender,
          educationQ,
          maritalStatus,
          userId,
          step
        };
        const missingFields = Object.keys(requiredFields).filter(
          (key) =>
            !requiredFields[key] || requiredFields[key].toString().trim() === ""
        );
        if (missingFields.length > 0) {
          return res.status(400).json({
            status: "error",
            message: `Missing fields: ${missingFields.join(", ")}`,
          });
        }
        // Gender validation
        const allowedGenders = ["male", "female", "other"];
        if (!allowedGenders.includes(gender)) {
          return res.status(400).json({
            status: "error",
            message: "Invalid gender value",
          });
        }
        // Education validation
        const allowedEducationQualification = [
          "10th Pass / Matriculation",
          "12th Pass / Higher Secondary",
          "Diploma / ITI",
          "Graduate (Bachelor’s Degree)",
          "Post Graduate (Master’s Degree)",
          "Professional Degree (CA / CS / MBBS / LLB / etc.)",
        ];
        if (!allowedEducationQualification.includes(educationQ)) {
          return res.status(400).json({
            status: "error",
            message: "Invalid education qualification value",
          });
        }
        // Marital validation
        const allowedMaritalStatus = ["Single", "Married"];
        if (!allowedMaritalStatus.includes(maritalStatus)) {
          return res.status(400).json({
            status: "error",
            message: "Invalid marital status",
          });
        }
        return next();
      }
      if (step == 2) {
        const { empType, cmpName, monthlyIncome, nextSalary, step } = req.body;
        const requiredFields = {
          empType,
          cmpName,
          monthlyIncome,
          nextSalary,
          step
        };
        const missingFields = Object.keys(requiredFields).filter(
          (key) =>
            !requiredFields[key] || requiredFields[key].toString().trim() === ""
        );
        if (missingFields.length > 0) {
          return res.status(400).json({
            status: "error",
            message: `Missing fields: ${missingFields.join(", ")}`,
          });
        }
        // Emp type validation
        const allowedEmpType = [
          "Private Sector",
          "Government Sector",
          "Self-Employed",
          "Freelancer / Independent Contractor",
          "Daily Wage / Labor Worker",
        ];
        if (!allowedEmpType.includes(empType)) {
          return res.status(400).json({
            status: "error",
            message: "Invalid employement type value",
          });
        }
        return next();
      }
      if (step == 3) {
        const {
          pincode,
          area,
          currentAddress,
          currentAddressOwnership,
          whoYouliveWith,
          step
        } = req.body;
        const requiredFields = {
          pincode,
          area,
          currentAddress,
          currentAddressOwnership,
          whoYouliveWith,
          step
        };
        const missingFields = Object.keys(requiredFields).filter(
          (key) =>
            !requiredFields[key] || requiredFields[key].toString().trim() === ""
        );
        if (missingFields.length > 0) {
          return res.status(400).json({
            status: "error",
            message: `Missing fields: ${missingFields.join(", ")}`,
          });
        }
        // Address Ownership validation
        const addressOwnership = ["Company Provided", "Owned", "Rented", "Other"];
        if (!addressOwnership.includes(currentAddressOwnership)) {
          return res.status(400).json({
            status: "error",
            message: "Invalid current address ownershipt value",
          });
        }
        return next();
      }
    }
    next();
  } catch (error) {
    console.error("Validation error:", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong during validation",
    });
  }
};

module.exports = pdApplicationValidation;
