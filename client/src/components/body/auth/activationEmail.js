import React, {useState, useEffect} from 'react';
import {useParams} from 'react-router-dom';
import axios from 'axios';
import {showErrMsg, showSuccessMsg} from '../../ultilities/notification/notification';

function ActivationEmail() {
  let {activation_token} = useParams();
  console.log(useParams());
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activation_token) {
      const activationEmail = async () => {
        try {
          const res = await axios.post('/user/activation', {activation_token});
          setSuccess(res.data.msg);
          
        } 
        catch (err) {
          console.log('err',err);
          err.response.data.msg && setErr(err.response.data.msg);
        }
      }
      activationEmail();
    }
  }, [activation_token])

  return (
    <div className="active_page">
      {err && showErrMsg(err)}
      {success && showSuccessMsg(success)}
    </div>
  )
}

export default ActivationEmail;