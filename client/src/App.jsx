import React from 'react'
import { Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import { Routes } from 'react-router-dom'
import Layout from './pages/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Writearticle from './pages/Writearticle.jsx'
import Blog from './pages/Blog.jsx'
import Generateimages from './pages/Generateimages.jsx'
import Removebackground from './pages/Removebackground.jsx'
import Removeobject from './pages/Removeobject.jsx'
import Reviewresume from './pages/Reviewresume.jsx'
import Community from './pages/Community.jsx'
import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import {Toaster} from 'react-hot-toast'

const App = () => {
  
  return (
    <div>
      <Toaster/>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/ai' element={<Layout/>}>
          <Route index element={<Dashboard/>} />
          <Route path='write-article' element={<Writearticle/>} />
          <Route path='blog-titles' element={<Blog/>} />
          <Route path='generate-images' element={<Generateimages/>} />
          <Route path='remove-background' element={<Removebackground/>} />
          <Route path='remove-object' element={<Removeobject/>} />
          <Route path='review-resume' element={<Reviewresume/>} />
          <Route path='community' element={<Community/>} />
        </Route>
      </Routes>
    </div>
  )
}

export default App