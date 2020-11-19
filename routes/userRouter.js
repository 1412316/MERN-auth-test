const router = require('express').Router();

const userCtrl = require('../controllers/userController');
const auth = require('../middlewares/auth');
const authAdmin = require('../middlewares/authAdmin');

router.post('/register', userCtrl.register);

router.post('/activation', userCtrl.activateEmail);

router.post('/login', userCtrl.logIn);

router.post('/refresh_token', userCtrl.getAccessToken);

router.post('/forgot', userCtrl.forgotPassword);

router.post('/reset', auth, userCtrl.resetPassword);

router.get('/info', auth, userCtrl.getUserInfo);

router.get('/all_info', auth, authAdmin, userCtrl.getAllUserInfo);

router.get('/logout', userCtrl.logOut);

router.patch('/update', auth, userCtrl.updateUser);

router.patch('/update_role/:id', auth, authAdmin, userCtrl.updateUserRole);

router.delete('/delete/:id', auth, authAdmin, userCtrl.deleteUser);

// Social login
router.post('/google_login', userCtrl.googleLogin);

router.post('/facebook_login', userCtrl.facebookLogin);

module.exports = router;