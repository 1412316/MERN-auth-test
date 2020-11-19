const Users = require('../models/userModel')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const sendEmail = require('./sendEmailController')

const {google} = require('googleapis')
const {OAuth2} = google.auth
const fetch = require('node-fetch')

const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID)

const {CLIENT_URL} = process.env;

const userCtrl = {
  register: async (req, res) => {
    try {
      const {name, email, password} = req.body;
      
      if (!name || !email || !password)
      {
        return res.status(400).json({
          msg: "Please fill in all fields."
        })
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          msg: "Invalid email."
        })
      }

      const user = await Users.findOne({email});
      if (user) {
        return res.status(400).json({
          msg: "Your email already exists."
        })
      }

      if (password.length < 6) {
        return res.status(400).json({
          msg: "Password must be at least 6 characters."
        })
      }

      // salt = 12
      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = {
        name,
        email,
        password: passwordHash
      }

      const activate_token = createActivateToken(newUser);

      const url = `${CLIENT_URL}/user/activate/${activate_token}`;
      sendEmail(email, url, "Verify your email address");

      console.log({activate_token});

      res.json({msg: "Register success! Please activate account from email to start."});
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  activateEmail: async (req, res) => {   // Can chep token vao body cua postman activate
    try {
      const {activation_token} = req.body;

      const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET);

      const { name, email, password } = user;
      const check = await Users.findOne({email});
      if (check) {
        return res.status(400).json({
          msg: "Your email already exists."
        });
      }
        
      const newUser = new Users({name, email, password});

      await newUser.save();

      res.json({msg: "Your account has been activated!"});
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  logIn: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await Users.findOne({email});
      if (!user) {
        return res.status(400).json({
          msg: "Your email does not exist."
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          msg: "Your password is incorrect."
        });
      }

      const refresh_token = createRefreshToken({id: user.id});
      res.cookie('refreshtoken', refresh_token, {
        httpOnly: true,
        path: '/user/refresh_token',
        maxAge: 7*24*60*60*1000   // 7 days
      });

      res.json({msg: "Login success!"});
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  getAccessToken: (req, res) => { // khong dung async ???
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token) {
        return res.status(400).json({
          msg: "Please login now."
        });
      }

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
          return res.status(400).json({
            msg: "Please login now."
          });
        }
        const access_token = createAccessToken({id: user.id});
        res.json({access_token});
      })
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const {email} = req.body;
      const user = await Users.findOne({email});
      if (!user) {
        return res.status(400).json({
          msg: "Your email does not exist."
        });
      }

      const access_token = createAccessToken({id: user._id});
      const url = `${CLIENT_URL}/user/reset/${access_token}`;
      sendEmail(email, url, "Reset your password");
      res.json({
        msg: "Re-send the password, please check your email."
      })
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const {password} = req.body;
      const passwordHash = await bcrypt.hash(password, 12);

      await Users.findOneAndUpdate(
        {
          _id: req.user.id
        }, 
        {
          password: passwordHash
        }
      );   // Mongodb syntax, _id from collection of mongodb

      res.json({msg: "Password successfully changed!"});
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  getUserInfo: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select('-password');
      res.json(user);
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  getAllUserInfo: async (req, res) => {
    try {
      const users = await Users.find().select('-password');
      res.json(users);
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  logOut: async (req, res) => {
    try {
      res.clearCookie('refreshtoken', {path: '/user/refresh_token'});
      return res.json({
        msg: "Log out."
      })
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  updateUser: async (req, res) => {
    try {
      const {name, avatar} = req.body;
      await Users.findOneAndUpdate({_id: req.user.id}, {name, avatar});
      res.json({msg: "Update success!"});
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  updateUserRole: async (req, res) => {
    try {
      const {role} = req.body;
      await Users.findOneAndUpdate({_id: req.params.id}, {role});
      res.json({msg: "Update success!"});
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  deleteUser: async (req, res) => {
    try {
      await Users.findByIdAndDelete(req.params.id);
      res.json({msg: "Delete success!"});
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  googleLogin: async (req, res) => {
    try {
      const {tokenId} = req.body

      const verify = await client.verifyIdToken({idToken: tokenId, audience: process.env.MAILING_SERVICE_CLIENT_ID})

      const {email, email_verified, name, picture} = verify.payload

      const password = email + process.env.GOOGLE_SECRET

      const passwordHash = await bcrypt.hash(password, 12)

      if (!email_verified) {
        return res.status(400).json({msg: "Email verification failed."})
      }

      const user = await Users.findOne({email})

      if (user) {
        const isMatch = await bcrypt.compare(password, passwordHash)
        if (!isMatch) {
          return res.status(400).json({msg: "Password is incorrect."})
        }

        const refresh_token = createRefreshToken({id: user.id});
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7*24*60*60*1000   // 7 days
        });

          res.json({msg: "Login success!"});
      }
      else {
        const newUSer = new Users({
          name,
          email,
          password: passwordHash,
          avatar: picture
        })

        await newUSer.save()
        const refresh_token = createRefreshToken({id: user.id});
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7*24*60*60*1000   // 7 days
        });

        res.json({msg: "Login success!"});
      }
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  },
  facebookLogin: async (req, res) => {
    try {
      const {accessToken, userID} = req.body

      const URL = `https://graph.facebook.com/v2.9/${userID}/?fields=id,name,email,picture&access_token=${accessToken}`

      const data = await fetch(URL).then(res => res.json()).then(res => {return res})
      console.log("data",data)

      const {email, name, picture} = data

      const password = email + process.env.FACEBOOK_SECRET

      const passwordHash = await bcrypt.hash(password, 12)

      const user = await Users.findOne({email})

      if (user) {
        const isMatch = await bcrypt.compare(password, passwordHash)
        if (!isMatch) {
          return res.status(400).json({msg: "Password is incorrect."})
        }

        const refresh_token = createRefreshToken({id: user.id});
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7*24*60*60*1000   // 7 days
        });

          res.json({msg: "Login success!"});
      }
      else {
        const newUSer = new Users({
          name,
          email,
          password: passwordHash,
          avatar: picture.data.url
        })

        await newUSer.save()
        const refresh_token = createRefreshToken({id: user.id});
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7*24*60*60*1000   // 7 days
        });

        res.json({msg: "Login success!"});
      }
    }
    catch (err) {
      return res.status(500).json({
        msg: err.message
      });
    }
  }
}

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

const createActivateToken = (payload) => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {expiresIn: '5m'});
}

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'});
}

const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'});
}

module.exports = userCtrl