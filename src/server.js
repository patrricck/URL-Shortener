require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const ShortURL = require('./shortURL')
const path = require('path')
const app = express()
const WEBSITE_URL = 'localhost:5000'

mongoose.connect('mongodb://localhost', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, '../static')))

const connection = mongoose.connection
connection.once("open", function() {
  console.log("MongoDB database connection established successfully");
});

app.post('/shortURL', async (req,res)=>{
  const shortEntry = await ShortURL.create({ full : req.body.fullURL , clicksAllowed : req.body.clicksAllowed })
  res.render('../views/success', {WEBSITE_URL : WEBSITE_URL, shortURL : shortEntry.short})
})

app.get('/:shortURL', async (req,res)=>{
  const link = await ShortURL.findOne({short: req.params.shortURL}).exec()
  if (link == null){
    return res.redirect('/')
  }
  else{
    const render = await res.render('../views/shortURL', {shortURL: link.short})
  }
})

app.post('/go-to/:shortURL', async (req,res)=>{
  const shortUrl = await ShortURL.findOne({short: req.params.shortURL}).exec()
  console.log(`User visited ${shortUrl.short}`)
  shortUrl.clicks++
  shortUrl.save()
  res.redirect(shortUrl.full)
  const allowed = shortUrl.clicksAllowed
  if (shortUrl.clicks >= allowed)
  {
    console.log(`Clicks for link ${shortUrl.short} have been exceeded. Deleting entry.`)
    await shortUrl.remove()
  }
})

app.listen(process.env.PORT || 5000)
