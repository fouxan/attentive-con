let isHost = sessionStorage.getItem("is_host") == 'true';
let gazeStartTime = null;
let resetGazeTimeout = null;
let lastSwitchTime = null;
const hostUID = "1";
const THRESHOLD_TIME = 1000;
const RESET_DELAY = 500;
const COOLDOWN = 10000;

function sendShiftFocusMessage(container, channel) {
    let uid = container.id.split("-")[2];

    if(channel){
        channel.sendMessage({
            text: JSON.stringify({ type: "switch_focus", uid: uid }),
        });
    }
}

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
                console.log(`Host is looking at ${container.id}. Checking if a second has passed.`);
                if (gazeStartTime === null) {
                    console.log("gazeStartTime is null")
                    gazeStartTime = new Date().getTime();
                }else {
                    const gazeDuration = new Date().getTime() - gazeStartTime;
                    console.log(`gazeStartTime not null. gazeDuration: ${gazeDuration}`,)
                    if (gazeDuration >= THRESHOLD_TIME) {
                        console.log(`Host looked at ${container.id} for a second. proceeding with shift focus logic.`);
                        const border_color = window
                        .getComputedStyle(container)
                        .getPropertyValue("border-color");
                        console.log(border_color);
                        if (border_color !== "rgb(0,128,0)" && container.id !== `user-container-${hostUID}`){
                            let hostWantsToFocus = confirm("Do you want to switch focus?")
                            if (hostWantsToFocus) {
                                console.log("Sending shift focus message.");
                                sendShiftFocusMessage(container, channel);
                                gazeStartTime = null;
                                lastSwitchTime = currentTime;
                            }else{
                                gazeStartTime = null;
                                lastSwitchTime = currentTime;
                            }
                        }
                        }else{
                            console.log("border_color is green, not sending message.");
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
}


