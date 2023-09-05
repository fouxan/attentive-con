window.saveDataAcrossSessions = true;

const THRESHOLD_TIME = 1000; // 1 second
const LEFT_CUTOFF = window.innerWidth / 4;
const RIGHT_CUTOFF = window.innerWidth - window.innerWidth / 4;

let startLookTime = Number.POSITIVE_INFINITY;
let lookDirection = null;
let videoElement;
let lookingAt;

webgazer.setGazeListener((data, timestamp) => {
    if (data == null || lookDirection === "STOP") return;
    startLookTime = timestamp;

    if (startLookTime + THRESHOLD_TIME < timestamp) {
        startLookTime = Number.POSITIVE_INFINITY;
        lookDirection = "STOP";
        setTimeout(() => {
            lookingAt = document.elementFromPoint(data.x, data.y).id;
            console.log(lookingAt);
            shiftFocus(lookingAt);
            lookDirection = "RESET";
        }, 200);
    }
}).begin();

function shiftFocus(user) {
    if(confirm("Do you want to switch focus?")){
        let userElement = document.getElementById(user);
        const uid = userElement.slice(5);
        const remoteStreams = client.remoteStreams;
        for(const stream of remoteStreams) {
            const audioTrack = stream.getAudioTrack();
            if (stream.getId() === uid){
                userElement.style.borderColor = "red";
                audioTrack.setVolume(1.0);
            }else{
                audioTrack.setVolume(0.5);
            }
        }
    }
}
