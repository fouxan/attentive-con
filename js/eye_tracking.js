const isHost = sessionStorage.getItem("is_host");

function shiftFocus(user) {
    if(confirm("Do you want to switch focus?")){
        let userElement = document.getElementById(user);
        const uid = userElement.slice(5);
        for(const stream of remoteStreams) {
            const audioTrack = stream.getAudioTrack();
            if (stream.getId() === uid){
                userElement.style.borderColor = "red";
                audioTrack.adjustUserPlaybackSignalVolume(uid, 100);
            }else{
                audioTrack.adjustUserPlaybackSignalVolume(uid, 50);
            }
        }
    }
}

if(isHost === "true"){
    window.saveDataAcrossSessions = true;

    const THRESHOLD_TIME = 1000; // 1 second

    let startLookTime = Number.POSITIVE_INFINITY;
    let lookDirection = null;
    let lookingAt;

    webgazer.setGazeListener((data, timestamp) => {
        if (data == null || lookDirection === "STOP") return;
        startLookTime = timestamp;

        if (startLookTime + THRESHOLD_TIME < timestamp) {
            startLookTime = Number.POSITIVE_INFINITY;
            lookDirection = "STOP";
            console.log("switching focus");
            setTimeout(() => {
                lookingAt = document.elementFromPoint(data.x, data.y).id;
                console.log(lookingAt);
                shiftFocus(lookingAt);
                lookDirection = "RESET";
            }, 200);
        }
    }).begin();
}
