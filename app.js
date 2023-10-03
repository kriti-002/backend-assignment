const express = require('express');
const _ = require('lodash')
const dotenv = require('dotenv').config()
const port= process.env.PORT

async function fetchData(req, res, next) {
  const link = 'https://intent-kit-16.hasura.app/api/rest/blogs'
  const headers = {
    'x-hasura-admin-secret' : process.env.ADMIN_SECRET
  }

  try {
    const { default: fetch } = await import('node-fetch')
    const response = await fetch(link, { headers })

    if (!response.ok) {
      res.status(500).json('Failed to fetch data')
    }

    const data = await response.json()
    req.fetchedData = data
    next()
  } catch (error) {
    next(error)
  }
}

const app = express();

app.get('/api/fetch-data', fetchData, (req, res) => {
  const fetchedData = req.fetchedData;
  if(!fetchedData) res.status(400).json({message : "No data found"})
  res.status(200).json(fetchedData);
})

app.get('/api/fetch-info', fetchData, (req, res)=>{
    const fetch= req.fetchedData.blogs
    if(!fetch) res.status(400).json({message : "No data found"})
    var totalBlogs=0, longestTitleLength= Number.MIN_VALUE, longestTitleValue="", privacyTitleCount= 0, titles= []
    _.each(fetch, blog=>{
        totalBlogs++;
        if(longestTitleLength < blog.title.length){
          longestTitleLength= blog.title.length
          longestTitleValue=blog.title
        }
        if(_.includes(blog.title.toLowerCase(), 'privacy')) privacyTitleCount++;
        titles.push(blog.title)
    })
    const uniqueTitles= _.uniq(titles)
    res.status(200).json({
      totalBlogs,
      longestTitleLength,
      longestTitleValue,
      privacyTitleCount,
      uniqueTitles
    })
})
app.get('/api/blog-search', fetchData, (req, res)=>{
  const blogs= req.fetchedData.blogs
  const query= req.query.query
  if(!blogs) res.status(400).json({message : "No data found"})
  if(!query) res.status(400).json({message: 'Please enter a valid keyword'})
  
  const searchQuery= _.filter(blogs, blog=> _.includes(blog.title.toLowerCase(), query.toLowerCase()))
  if(searchQuery.length ===0 ) res.status(400).json({message: 'Try again with a different keyword'})
  res.status(200).json({searchQuery, message : "success"})
})

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
