const APP_ID = "af633987e6be495aafe799b3d6daca51"

let uid = sessionStorage.getItem('uid')
if(!uid){
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid', uid)
}
let isHost = sessionStorage.getItem("is_host") === "true";
let hostUID;
if(isHost){
    hostUID = "1";
    uid = "1";
    sessionStorage.setItem("uid", hostUID)
}else{
    hostUID = "1";
}

let token = null;
let client;

let rtmClient;
let channel;

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if(!roomId){
    roomId = 'main'
}

let displayName = sessionStorage.getItem('display_name')
if(!displayName){
    window.location = 'index.html'
}

let localTracks = []
let remoteUsers = {}

let joinRoomInit = async () => {
    rtmClient = await AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({uid,token})

    await rtmClient.addOrUpdateLocalUserAttributes({'name':displayName})

    channel = await rtmClient.createChannel(roomId)
    await channel.join()

    channel.on('ChannelMessage', handleChannelMessage)

    client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})
    await client.join(APP_ID, roomId, token, uid)

    client.on('user-published', handleUserPublished)
    client.on('user-left', handleUserLeft)
}

let joinStream = async () => {
    document.getElementById('join-btn').style.display = 'none'
    document.getElementsByClassName('stream__actions')[0].style.display = 'flex'

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()

    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`

    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)

    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[0], localTracks[1]])
    channel.sendMessage({
        text: JSON.stringify({ type: "distinguish_host", uid: hostUID }),
    });
    if(isHost){
        videoContainer = document.getElementById(`user-container-${uid}`)
        videoContainer.style.borderColor = "green"
        attachGazeTracking(videoContainer, channel);
    }
}

let handleUserPublished = async (user, mediaType) => {
    remoteUsers[user.uid] = user

    await client.subscribe(user, mediaType)

    let player = document.getElementById(`user-container-${user.uid}`)
    if(player === null){
        player = `<div class="video__container" id="user-container-${user.uid}">
                <div class="video-player" id="user-${user.uid}"></div>
            </div>`

        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
    }
    channel.sendMessage({
        text: JSON.stringify({ type: "distinguish_host", uid: hostUID }),
    });
    if(isHost){
        videoContainer = document.getElementById(`user-container-${user.uid}`)
        attachGazeTracking(videoContainer, channel);
    }

    if(mediaType === 'video'){
        user.videoTrack.play(`user-${user.uid}`)
    }

    if(mediaType === 'audio'){
        user.audioTrack.play()
    }

}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    let item = document.getElementById(`user-container-${user.uid}`)
    if(item){
        item.remove()
    }
}

let toggleMic = async (e) => {
    let button = e.currentTarget

    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[0].setMuted(true)
        button.classList.remove('active')
    }
}

let toggleCamera = async (e) => {
    let button = e.currentTarget

    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[1].setMuted(true)
        button.classList.remove('active')
    }
}

let leaveStream = async (e) => {
    e.preventDefault()

    document.getElementById('join-btn').style.display = 'block'
    document.getElementsByClassName('stream__actions')[0].style.display = 'none'

    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.unpublish([localTracks[0], localTracks[1]])

    document.getElementById(`user-container-${uid}`).remove()

    channel.sendMessage({text:JSON.stringify({'type':'user_left', 'uid':uid})})
}

function handleChannelMessage(messageData, MemberId){
    let data = JSON.parse(messageData.text)
    console.log(`A new message was received ${data.type}`)
    if(data.type === 'user_left'){
        document.getElementById(`user-container-${data.uid}`).remove()
    }

    if(data.type === 'switch_focus'){
        let videoContainers = document.getElementsByClassName("video_container");
        for(const videoContainer in videoContainers){
            let videoPlayer = videoContainer.children[0];
            if(videoContainer.id === `user-container-${data.uid}` || videoContainer.id === `user-container-${hostUID}`){
                videoContainer.style.borderColor = "green"
                videoPlayer.volume = 1.0
            }else{
                videoContainer.style.borderColor = "white"
                videoPlayer.volume = 0.5
            }
        }
    }

    if(data.type === 'distinguish_host'){
        let hostVideoContainer = document.getElementById(`user-container-${hostUID}`);
        hostVideoContainer.style.borderColor = "green";
    }
}

let leaveChannel = async () => {
    await channel.leave()
    await rtmClient.logout()
}

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveStream)
window.addEventListener('beforeunload', leaveChannel)

joinRoomInit()