console.log(`Client Side Javascript`);
const socket = io()

const messageForm = document.querySelector('#message-form')
const messageInput = document.querySelector('.textspace')
const sendBtn = document.querySelector('.send')
const messages = document.querySelector('.messages')
const userLocation = document.querySelector('.user-location')

// Template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('.location-template')
const sidebarTemplate = document.querySelector('.sidebar-template').innerHTML
// Queries
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const newMessage = messages.lastElementChild

    // Height of new message
    const newMessageStyle  = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin
    
    // Visible Height
    const visibleHeight = messages.offsetHeight
    // Height of container
    const containerHeight = messages.scrollHeight
    // How far has scrolled
    const scrollOffset = messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight < scrollOffset+10){
        messages.scrollTop = messages.scrollHeight;
    }
}

// const btn = document.querySelector('.btn')

// btn.addEventListener('click', () => {
//     console.log('clicked');
//     socket.emit('increment')
// })

// socket.on('countUpdate', (count) => {
//     console.log(`count: ${count}`);
// })

socket.on('roomData', ({room, members}) => {
    const userList = members.map(member => `<li>${member.username}</li>`).join('');
    const sidebar = `<h2 class="room-title">${room}</h2>
        <h3 class="list-title">Users</h3>
        <ul class="users">
            ${userList}
        </ul>`
    document.querySelector('#sidebar').innerHTML = sidebar
})

socket.on('message', (msg) => {
    const messageObject = {
        username: msg.username,
        message: msg.text,
        time: moment(msg.createdAt).format('h:mm a')
    }

    const html = `<div>
        <span class="message__name">${messageObject.username}</span>
        <span class="message__meta">${messageObject.time}</span>
        ${messageObject.message}</div>`
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (location) => {
    const locationObject = {
        username: location.username,
        url: location.url,
        time: moment(location.createdAt).format('h:mm a')
    }
    const link = `<div>
        <span class="message__name">${locationObject.username}</span>
        <span class="message__meta">${locationObject.time}</span>
        <a href="${locationObject.url} target="_blank" >User Location</a></div>`
    userLocation.insertAdjacentHTML('beforeend', link)
    autoscroll()
})

const sendMessage = () => {
    sendBtn.disabled = true

    const message = messageInput.value
    socket.emit('sendMessage', message, (error) => {
        sendBtn.disabled = false
        messageInput.value = ''
        messageInput.focus()

        if(error){
            return console.log(error)
        }
    })
}

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    sendMessage();
})


const sendLocation = document.querySelector('.send-location')
sendLocation.addEventListener('click', () => {
    sendLocation.disabled = true
    if(!navigator.geolocation){
        return alert('geolocation is not supported by your browser.')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }

        socket.emit('location', location.latitude, location.longitude, () => {
            sendLocation.disabled = false
            console.log('Location Shared')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})

