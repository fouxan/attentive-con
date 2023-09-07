function sendShiftFocusMessage(container, channel) {
    let uid = container.id.split("-")[2];

    let isHost = sessionStorage.getItem("isHost") === 'true';
    if(isHost && channel){
        channel.sendMessage({
            text: JSON.stringify({ type: "switch_focus", uid: uid }),
        });
    }
}

function isLookingAtElement(gazeData, element) {
    const elementRect = element.getBoundingClientRect();
    const gazeX = gazeData.x;
    const gazeY = gazeData.y;

    return (
        gazeX >= elementRect.left - 100 &&
        gazeX <= elementRect.right + 100 &&
        gazeY >= elementRect.top - 100 &&
        gazeY <= elementRect.bottom + 100
    );
}

function attachGazeTracking(container, channel) {
    let gazeStartTime = null;

    webgazer.setGazeListener(function (data, elapsedTime) {
        if (data == null) {
            gazeStartTime = null;
            return;
        }

        if (isLookingAtElement(data, container)) {
            if (gazeStartTime === null) {
                gazeStartTime = new Date().getTime();
            } else {
                const gazeDuration = new Date().getTime() - gazeStartTime;
                if (gazeDuration >= 1000) {
                    const border_color = window
                    .getComputedStyle(container)
                    .getPropertyValue("border-color");
                    if (border_color === "white") {
                        if (confirm("Do you want to switch focus?")) {
                            sendShiftFocusMessage(container, channel);
                        }
                    }
                }
            }
        } else {
            gazeStartTime = null;
        }
    }).begin();
}
