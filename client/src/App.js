import {BrowserRouter as Router} from 'react-router-dom'
import React, {useEffect} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import axios from 'axios'

import Header from './components/header/Header'
import Body from './components/body/Body'
import {dispatchLogin, fetchUser, dispatchGetUser} from './redux/actions/authAction'

function App() {
  const dispatch = useDispatch();
  const token = useSelector(state => state.token)
  const auth = useSelector(state => state.auth)

  useEffect(() => {
    const firstLogin = localStorage.getItem('first login')
    if (firstLogin) {
      const getToken = async () => {
        const res = await axios.post('/user/refresh_token', null)
        dispatch({
          type: 'GET_TOKEN',
          payload: res.data.access_token
        })
      }
      getToken()
    }
  }, [auth.isLogged, dispatch])

  useEffect(() => {
    if (token) {
      const getUser = () => {
        dispatch(dispatchLogin())

        return fetchUser(token).then(res => {
          dispatch(dispatchGetUser(res))
        })
      }
      getUser()
    }
  }, [token, dispatch])

  return (
    <Router>
      <div className="App">
        <Header />
        <Body />
      </div>
    </Router>
  );
}

export default App;
