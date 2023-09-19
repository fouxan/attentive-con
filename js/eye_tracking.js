const HOST_UID = "1";
const THRESHOLD_TIME = 1000;
const RESET_DELAY = 500;
const COOLDOWN = 10000;
let isHost = sessionStorage.getItem("is_host") == 'true';
let gazeStartTime = null;
let resetGazeTimeout = null;
let lastSwitchTime = null;
let currentFocusedGroup = null;

function isLookingAtElement(gazeData, element) {
    if(typeof element === 'object' && element !== null && 'getBoundingClientRect' in element){
        const elementRect = element.getBoundingClientRect();
        const gazeX = gazeData.x;
        const gazeY = gazeData.y;

        return (looking = gazeX >= elementRect.left - 100 &&
        gazeX <= elementRect.right + 100 &&
        gazeY >= elementRect.top - 100 &&
        gazeY <= elementRect.bottom + 100);
    }
    return false;
}

let changeVolumeForUser = async (usersUID, volumeLevel) => {
    if(usersUID === uid){
        await localTracks[0].setVolume(volumeLevel);
    }else{
        let userObject = remoteUsers[usersUID];
        await userObject.audioTrack.setVolume(volumeLevel);
    }
}

function focusOnUser(uid) {
    console.log('Focusing on user:', uid);

    const focusedUserContainer = document.getElementById(`user-container-${uid}`);
    if (focusedUserContainer) {
        focusedUserContainer.classList.add('focused-user');
        focusedUserContainer.classList.remove('unfocused-user');
        changeVolumeForUser(uid, 100);
        currentFocusedGroup = userGroups[uid];
    }

    for (let userId in remoteUsers) {
        let currentUsersGroup = userGroups[userId];
        console.log('Processing user:', userId);
        if (userId !== uid && userId !== HOST_UID && currentUsersGroup !== currentFocusedGroup) {
            const userContainer = document.getElementById(`user-container-${userId}`);
            if (userContainer) {
                userContainer.classList.add('unfocused-user');
                userContainer.classList.remove('focused-user');
                changeVolumeForUser(userContainer.id.split("-")[2], 20);
            }
        }
    }
}


if(isHost){
    webgazer.setGazeListener(function (gazeData, elapsedTime) {
        if (gazeData == null) {
            gazeStartTime = null;
            return;
        }
        let currentTime = new Date().getTime();
        if(lastSwitchTime && currentTime - lastSwitchTime < COOLDOWN) return;

        let videoContainers = document.getElementsByClassName("video__container");
        for(container of videoContainers){
            if (isLookingAtElement(gazeData, container)) {
                if (gazeStartTime === null) {
                    gazeStartTime = new Date().getTime();
                }else {
                    const gazeDuration = new Date().getTime() - gazeStartTime;
                    if (gazeDuration >= THRESHOLD_TIME) {
                        if (!container.classList.contains("focused-user") && container.id != `user-container-${HOST_UID}`){
                            let hostWantsToFocus = confirm("Do you want to switch focus?")
                            if (hostWantsToFocus) {
                                focusOnUser(container.id.split("-")[2])
                            }
                            gazeStartTime = null;
                            lastSwitchTime = currentTime;
                        }
                    }
                }

                if (resetGazeTimeout) {
                    clearTimeout(resetGazeTimeout);
                    resetGazeTimeout = null;

                }
            } else {
                if (!resetGazeTimeout) {
                    resetGazeTimeout = setTimeout(() => {
                        gazeStartTime = null;
                        resetGazeTimeout = null;
                    }, RESET_DELAY);
                }
            }

        }
    }).begin();

    webgazer.showVideoPreview(false).showPredictionPoints(false);
}


