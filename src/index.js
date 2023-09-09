const express = require('express')
const http = require('http')
const path = require('path')
const { Server } = require('socket.io')
const ejs = require('ejs');
const router = require('./routes/route');
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express();
const httpServer = http.createServer(app)
const io = new Server(httpServer)
const publicDirectoryPath = path.join(__dirname, '../public')
const viewspath = path.join(__dirname, '../views')

// app.set('view engine', 'ejs')
// app.set('views', viewspath)

app.use(express.static(publicDirectoryPath))
app.use(express.json())

// let count = 0
const msg = 'Welcome'
const admin = 'Room Bot'
io.on('connection', (socket) => {
    console.log(`New Web Socket Connection`);

    // socket.emit('countUpdate', count)

    // socket.on('increment', () => {
    //     count++
    //     // socket.emit('countUpdate', count)
    //     io.emit('countUpdate', count)
    // })

    // socket.broadcast.emit('message', generateMessage('A new User has joined the chat!'))
    // socket.emit('message', generateMessage(msg))

    socket.on('join', ({username, room}, callback) => {
        const { error, user } = addUser({id: socket.id, username, room})

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage(admin,'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage( admin, `Yayy! ${username} has joined the ${room}`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            members: getUsersInRoom(user.room)
        })

        socket.on('disconnect', () => {
            const user = removeUser(socket.id)

            if(user){
               io.to(user.room).emit('message', generateMessage(admin, `${username} has left!`))
                io.to(user.room).emit('roomData', {
                    room: user.room,
                    members: getUsersInRoom(user.room)
                })
            }
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const sender = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(message)){
            return callback('Bad words are not allowed!')
        }

        io.to(sender.room).emit('message', generateMessage(sender.username, message))
        callback()
    })

    // socket.on('disconnect', () => {
    //     io.emit('message', generateMessage('A user has left!'))
    // })

    socket.on('location', (latitude, longitude, callback) => {
        const sender = getUser(socket.id)
        const coordinates = `http://www.google.com/maps/place/${latitude},${longitude}`
        socket.broadcast.to(sender.room).emit('locationMessage', generateLocationMessage(sender.username, coordinates))
        callback()
    })
})
const port = process.env.PORT||3000
app.use(router)

httpServer.listen(port, () => {
    console.log(`Server running at ${port}`)
})
