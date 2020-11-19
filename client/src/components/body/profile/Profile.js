import React, {useState, useEffect} from 'react'
import axios from 'axios'
import {useSelector, useDispatch} from 'react-redux'
import {Link} from 'react-router-dom'
import {isLength, isMatch} from '../../ultilities/validation/validation'
import {showErrMsg, showSuccessMsg} from '../../ultilities/notification/notification'
import {fetchAllUSers, dispatchGetAllUsers} from '../../../redux/actions/usersAction'

const initialState = {
  name: '',
  password: '',
  cf_password: '',
  err: '',
  success: ''
}

function Profile() {
  const auth = useSelector(state => state.auth)
  const token = useSelector(state => state.token)

  const users = useSelector(state => state.users)
  console.log("1", users)

  const {user, isAdmin} = auth
  const [data, setData] = useState(initialState)
  const {name, password, cf_password, err, success} = data
  const [avatar, setAvatar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [callback, setCallback] = useState(false)

  const dispatch = useDispatch()

  useEffect(() => {   // Chỉ hiển thị giá trị đầu bắt được
    if (isAdmin) {
      fetchAllUSers(token).then(res => {
        dispatch(dispatchGetAllUsers(res))
      })
    }
  }, [token, isAdmin, dispatch, callback])   // Thứ tự ???

  const handleChange = e => {
    const {name, value} = e.target
    setData({...data, [name]: value, err: '', success: ''})
  }

  const updateInfo = () => {
    try {
      axios.patch('/user/update', {
        name: name ? name : user.name,
        avatar: avatar ? avatar : user.avatar
      }, {
        headers: {Authorization: token}
      })
      setData({...data, err: '', success: "Update success!"})
    }
    catch (err) {
      setData({...data, err: err.response.data.msg, success: ''})
    }
  }

  const updatePassword = () => {
    if (isLength(password)) {
      return setData({
        ...user,
        err: "Password must be at least 6 characters.",
        success: ''
      });
    }

    if (!isMatch(password, cf_password)) {
      return setData({
        ...user,
        err: "Your confirm password does not match",
        success: ''
      });
    }
      
    try {
      axios.post('/user/reset', {password}, {
        headers: {Authorization: token}
      })
      setData({...data, err: '', success: "Update success!"})
    }
    catch (err) {
      setData({...data, err: err.response.data.msg, success: ''})
    }
  }

  const handleUpdate = () => {
    if (name || avatar) {
      updateInfo()
    }
    if (password) {
      updatePassword()
    }
  }

  const updateAvatar = async(e) => {
    e.preventDefault()
    try {
      const file = e.target.files[0]

      if (!file) {
        return setData({...data, err: 'No file was uploaded', success: ''})
      }

      if (file.size > 1024 * 1024) {
        return setData({...data, err: 'Size too large.', success: ''})
      }

      if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
        return setData({...data, err: 'Your file format is incorrect. Please use .png or .jpg or .jpeg file.', success: ''})
      }

      let formData = new FormData()
      formData.append('file', file)

      setLoading(true)
      const res = await axios.post('/api/upload_avatar', formData, {
        headers: {'content-type': 'multipart/form-data', Authorization: token}
      })

      setLoading(false)
      setAvatar(res.data.url)
    }
    catch (err) {
      setData({...data, err: err.response.data.msg, success: ''})
    }
  }

  return (
    <>
    <div>
      {err && showErrMsg(err)}
      {success && showSuccessMsg(success)}
      {loading && <h3>Loading.....</h3>}
    </div>
    <div className="profile_page">
      <div className="col-left">
        <h2>{isAdmin ? "Admin profile" : "User profile"}</h2>

        <div className="avatar">
          <img src={avatar ? avatar : user.avatar} alt="" />
          <span>
            <i className="fas fa-camera"></i>
            <p>Change</p>
            <input type="file" name="file" id="file_upload" onChange={updateAvatar}></input>
          </span>
        </div>
      
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input type="text" name="name" id="name" placeholder="Your name" defaultValue={user.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" name="email" id="email" placeholder="Your email address" defaultValue={user.email} disabled />
        </div>

        <div className="form-group">
          <label htmlFor="password">New password</label>
          <input type="password" name="password" id="password" placeholder="Your new password" value={password} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="cf_password">Confirm new password</label>
          <input type="password" name="cf_password" id="cf_password" placeholder="Confirm new password" value={cf_password} onChange={handleChange} />
        </div>

        <div>
          <em style={{color: "crimson"}}>
            * If you update your password here, you will not be able to login quickly using google and facebook.
          </em>
        </div>
        
        <button disabled={loading} onClick={handleUpdate}>Update profile</button>
      </div>
      
      <div className="col-right">
        <h2>{isAdmin ? "Users" : "My order"}</h2>
        <div style={{overflowX: "auto"}}>
          <table className="customers">
            <thead>
              <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Email</th>
                <th>Admin</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {
                users.map(user => {
                  <tr key={user._id}>
                    <td>{user._id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      {
                        user.role === 1
                          ? <i className="fas fa-check" title="Admin"></i>
                          : <i className="fas fa-times" title="User"></i>
                      }
                    </td>
                    <td>
                      <Link to={`/edit_user/${user._id}`}>
                        <i className="fas fa-edit" title="Edit"></i>
                      </Link>
                      <i className="fas fa-trash-alt" title="Remove"></i>
                    </td>
                  </tr>
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  )
}

export default Profile
