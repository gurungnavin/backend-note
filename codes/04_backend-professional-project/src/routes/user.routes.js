import { Router } from "express"
import { userRegister, userLogin, userLogOut, refreshAccessToken } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middlerware.js"
import { verifyJwt } from "../middlewares/auth.middlerware.js"

const router = Router()

router.route("/register").post(upload.fields([
  {
    name : "avatar",
    maxCount : 1,
  },
  {
    name : "coverImage",
    maxCount: 1,
  }
]), userRegister)

router.route("/login").post(userLogin)
router.route("/logout").post(verifyJwt, userLogOut)
router.route("/refresh-token").post(refreshAccessToken)

export default router;