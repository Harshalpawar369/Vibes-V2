import {createSlice} from '@reduxjs/toolkit'



const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    activeTabs: 'All'
  },
  reducers: {
    setQuery(state, action) {
      state.query = action.payload
    },
    setActiveTabs(state, action) {
      state.activeTabs = action.payload
    }
  }
})

export const {setQuery,setActiveTabs} = searchSlice.actions

export default searchSlice.reducer