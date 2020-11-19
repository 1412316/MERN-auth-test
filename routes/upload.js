const router = require('express').Router();

const uploadImage = require('../middlewares/uploadImage');
const auth = require('../middlewares/auth');
const uploadCtrl = require('../controllers/uploadController');

router.post('/upload_avatar', uploadImage, auth, uploadCtrl.uploadAvatar);

module.exports = router