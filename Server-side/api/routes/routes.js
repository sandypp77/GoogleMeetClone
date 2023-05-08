const express = require('express')
const router = express.Router()
const API = require('../controllers/api')
const multer = require('multer')

//multer middleware
let storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'uploads')
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname+"_"+Date.now()+"_"+file.originalname)
    }
})

let upload = multer({
    storage: storage,
}).single("image")

router.get("/", API.testing)
router.get("/all", API.fetchAllUser)
router.post("/signup", API.register)
router.post("/signin", API.login)
router.delete("/delete/:id", API.deleteUser)
router.get("/upload", upload,  API.uploadImage)
router.get("/fetch", API.fetchPost)

module.exports = router