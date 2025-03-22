const express = require("express");
const router = express.Router();
const userController = require("./controller/userController");
const bannerController = require("./controller/bannerController");
const addressController = require("./controller/addressController");
const venderController = require("./controller/venderController");
const driverController = require("./controller/driverController");

router.use("/user", userController);
router.use("/driver", driverController);
router.use("/banner", bannerController);
router.use("/address", addressController);
router.use("/vender", venderController);


module.exports = router;