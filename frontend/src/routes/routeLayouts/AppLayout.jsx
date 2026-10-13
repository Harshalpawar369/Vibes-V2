import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../../pages/components/Navbar.jsx'
// import Ai from '../../pages/components/Ai.jsx'

const AppLayout = () => {
  return (
    <>
      <Navbar />
      
      <Outlet />
      {/* <Ai/> */}
    </>
  )
}

export default AppLayout
