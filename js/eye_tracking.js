function shiftFocus(container) {
    if(confirm("Do you want to switch focus?")){
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

// Function to attach gaze tracking logic to a video container
function attachGazeTracking(container) {
    let gazeStartTime = null;

    webgazer.setGazeListener(function(data, elapsedTime) {
        if (data == null) {
            // User is not looking at the screen
            gazeStartTime = null;
            return;
        }

        // Check if the user is looking at the video container
        if (isLookingAtElement(data, container)) {
            if (gazeStartTime === null) {
                // User has just started looking at the element
                gazeStartTime = new Date().getTime();
            } else {
                // Calculate the time spent looking at the element
                const gazeDuration = new Date().getTime() - gazeStartTime;

                // Check if the user has looked at the element for the desired duration (e.g., 1000 milliseconds)
                if (gazeDuration >= 1000) {
                    // Change the borderColor of the video container
                    shiftFocus(container); // Change to your desired style
                }
            }
        } else {
            // User is not looking at the video container
            gazeStartTime = null;
        }
    }).begin();
}
