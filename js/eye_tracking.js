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

function isLookingAtElement(gazeData, element) {
    const elementRect = element.getBoundingClientRect();
    const gazeX = gazeData.x;
    const gazeY = gazeData.y;

    return (
        gazeX >= elementRect.left &&
        gazeX <= elementRect.right &&
        gazeY >= elementRect.top &&
        gazeY <= elementRect.bottom
    );
}

if(isHost === "true"){
    window.saveDataAcrossSessions = true;
    let messageContainer = document.getElementById("messages__container");
    let gazeStartTime = null;

    webgazer.setGazeListener((data, elapsedTime) => {
        if (data == null){
            gazeStartTime = null;
            return;
        }

        if (isLookingAtElement(data, messageContainer)) {
            if (gazeStartTime === null) {
                gazeStartTime = new Date().getTime();
            } else {
                const gazeDuration = new Date().getTime() - gazeStartTime;
                if (gazeDuration >= 1000) {
                    messageContainer.style.backgroundColor = "black";
                    console.log("Changed the color of message container.");
                }
            }
        } else {
            gazeStartTime = null;
        }
        // if (elapsedTime > THRESHOLD_TIME) {
        //     console.log("switching focus");
        //     setTimeout(() => {
        //         lookingAt = document.elementFromPoint(data.x, data.y).id;
        //         console.log(lookingAt);
        //         shiftFocus(lookingAt);
        //     }, 200);
        // }
    }).begin();
}
