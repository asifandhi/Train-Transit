import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  status: false,
  user: null,
  role: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.status = true
      state.user = action.payload.user
      state.role = action.payload.role
    },
    logout: (state) => {
      state.status = false
      state.user = null
      state.role = null
    },
  },
})

export const { login, logout } = authSlice.actions
export default authSlice.reducer
