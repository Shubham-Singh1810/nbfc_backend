const express = require("express");
const router = express.Router();
const userController = require("./controller/userController");
const bannerController = require("./controller/bannerController");
const venderController = require("./controller/venderController");
const driverController = require("./controller/driverController");
const categoryController = require("./controller/categoryController");
const subCategory = require("./controller/subCategoryController");
const brandController = require("./controller/brandController");
const attributeSetController = require("./controller/attributeSetController");

router.use("/user", userController);
router.use("/driver", driverController);
router.use("/banner", bannerController);
router.use("/vender", venderController);
router.use("/category", categoryController);
router.use("/subCategory", subCategory);
router.use("/brand", brandController);
router.use("/attribute-set", attributeSetController);


module.exports = router;