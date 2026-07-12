const express = require("express")
const {loginCheck,viewOnlyBy} = require("../middleware/auth")
const {
    AuthorityLogin,
    AuthorityRegister,
    AuthorityLogout,
    AuthorityProfile
} = require("../controllers/apiAuth")

const router = express.Router();

router.post("/login",AuthorityLogin)

router.post("/register",AuthorityRegister)

router.post("/logout",loginCheck,AuthorityLogout)

router.get("/me",loginCheck,AuthorityProfile)

module.exports = router;