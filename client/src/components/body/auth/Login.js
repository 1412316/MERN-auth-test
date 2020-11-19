import React, {useState} from 'react'
import { Link, useHistory } from 'react-router-dom'
import axios from 'axios'
import {GoogleLogin} from 'react-google-login'
import FacebookLogin from 'react-facebook-login'

import {showErrMsg, showSuccessMsg} from '../../ultilities/notification/notification'
import {dispatchLogin} from '../../../redux/actions/authAction'
import {useDispatch} from 'react-redux'

const initialState = {
  email: '',
  password: '',
  err: '',
  success: ''
}

function Login() {
  const [user, setUser] = useState(initialState)

  const dispatch = useDispatch()
  const history = useHistory()

  const {email, password, err, success} = user

  const handleChangeInput = e => {
    const {name, value} = e.target
    setUser({
      ...user, 
      [name]: value, 
      err: '',
      success: ''
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const res = await axios.post('/user/login', {email, password})
      setUser({
        ...user,
        err: '',
        success: res.data.msg
      })

      localStorage.setItem('first login', true)
      dispatch(dispatchLogin())
      history.push("/")
    }
    catch (err) {
      err.response.data.msg &&
      setUser({
        ...user,
        err: err.response.data.msg,
        success: ''
      });
    }
  }

  const responseGoogle = async (response) => {
    try {
      const res = await axios.post('/user/google_login', {tokenId: response.tokenId})

      setUser({
        ...user,
        err: '',
        success: res.data.msg
      })

      localStorage.setItem('first login', true)
      dispatch(dispatchLogin())
      history.push("/")
    } 
    catch (err) {
      err.response.data.msg &&
      setUser({
        ...user,
        err: err.response.data.msg,
        success: ''
      })
    }
  }

  const responseFacebook = async (response) => {
    console.log(response)
    try {
      const {accessToken, userID} = response
      const res = await axios.post('/user/facebook_login', {accessToken, userID})

      setUser({
        ...user,
        err: '',
        success: res.data.msg
      })

      localStorage.setItem('first login', true)
      dispatch(dispatchLogin())
      history.push("/")
    } 
    catch (err) {
      err.response.data.msg &&
      setUser({
        ...user,
        err: err.response.data.msg,
        success: ''
      })
    }
  }

  return (
    <div className="login__page">
      <h2>Login</h2>
      {err && showErrMsg(err)}
      {success && showSuccessMsg(success)}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email Address</label>
          <input 
            type="text" 
            placeholder="Enter email address" id="email" 
            value={email} 
            name="email" 
            onChange={handleChangeInput}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            placeholder="Enter your password" id="password" 
            value={password} 
            name="password"
            onChange={handleChangeInput}
          />
        </div>
        <div className="row">
          <button type="submit">Login</button>
          <Link to="/forgot_password">Forgot your password?</Link>
        </div>
      </form>

      <div className="hr">Or log in with</div>

      <div className="social">
        <GoogleLogin
          clientId="696386700626-8roq3k476vvt9p5vc1j5iq45ema714dn.apps.googleusercontent.com"
          buttonText="Login with google"
          onSuccess={responseGoogle}
          cookiePolicy={'single_host_origin'} 
        />
        <FacebookLogin
          appId="224405702374158"
          autoLoad={false}
          fields="name,email,picture"
          callback={responseFacebook}
        />
      </div>

      <p>Create a new account
        <Link to="/register"> Sign up</Link>
      </p>

    </div>
  )
}

export default Login