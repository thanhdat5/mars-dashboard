require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

// API get all rovers
app.get('/api/rovers', async (req, res) => {
    try {
        const url = `https://api.nasa.gov/mars-photos/api/v1/rovers?api_key=${process.env.API_KEY}`
        let rovers = await fetch(url)
        rovers = await rovers.json();
        res.send(rovers)
    } catch (err) {
        console.log('error:', err);
    }
})

// API get rovers photos
app.get('/api/rovers/:name', async (req, res) => {
    try {
        const cDate = req.query.max_date
        const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${req.params.name}/photos?earth_date=${cDate}&api_key=${process.env.API_KEY}`
        let image = await fetch(url)
        image = await image.json();
        res.send(image)
    } catch (err) {
        console.log('error:', err);
    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))