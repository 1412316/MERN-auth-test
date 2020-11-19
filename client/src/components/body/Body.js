import React from 'react';
import {Switch, Route} from 'react-router-dom'
import {useSelector} from 'react-redux'

import Login from './auth/Login'
import Register from './auth/register'
import ActivationEmail from './auth/activationEmail'
import NotFound from '../ultilities/notFound/notFound'
import ForgotPassword from './auth/forgotPassword'
import ResetPassword from './auth/resetPassword'
import Profile from './profile/Profile'
import EditUser from './profile/EditUser'
import Home from './home/home'

function Body() {
  const auth = useSelector(state => state.auth)
  const {isLogged, isAdmin} = auth

  return (
    <section>
      <Switch>
        <Route path="/" component={Home} exact />
        <Route path="/login" component={isLogged ? NotFound : Login} exact />
        <Route path="/register" component={isLogged ? NotFound : Register} exact />
        <Route path="/forgot_password" component={isLogged ? NotFound : ForgotPassword} exact />
        <Route path="/user/reset/:token" component={isLogged ? NotFound : ResetPassword} exact />
        <Route path="/user/activate/:activation_token" component={ActivationEmail} exact />
        <Route path="/profile" component={isLogged ? Profile : NotFound} exact />
        <Route path="/edit_user/:id" component={isAdmin ? EditUser : NotFound} exact />
      </Switch>
    </section>
  );
}

export default Body;