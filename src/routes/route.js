const express = require('express')

const app = express()
const router = new express.Router()

router.get('/', async (req, res) =>{
    res.render('index.ejs')
})

router.get('/chat.ejs', async (req, res) =>{
    res.render('chat.ejs')
})

module.exports = router