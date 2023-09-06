function sendShiftFocusMessage(container) {
  let idParts = container.id.split("-");
  let uid = containerId[idParts.length - 1];

  channel.sendMessage({
    text: JSON.stringify({ type: "switch_focus", uid: uid }),
  });
}

function isLookingAtElement(gazeData, element) {
  const elementRect = element.getBoundingClientRect();
  const gazeX = gazeData.x;
  const gazeY = gazeData.y;

  return (
    gazeX >= elementRect.left - 20 &&
    gazeX <= elementRect.right + 20 &&
    gazeY >= elementRect.top - 20 &&
    gazeY <= elementRect.bottom + 20
  );
}

function attachGazeTracking(container) {
  let gazeStartTime = null;

  webgazer
    .setGazeListener(function (data, elapsedTime) {
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
                sendShiftFocusMessage(container);
                // for(const stream of remoteStreams) {
                //     const audioTrack = stream.getAudioTrack();
                //     if (stream.getId() === uid){
                //         audioTrack.adjustUserPlaybackSignalVolume(uid, 100);
                //     }else{
                //         container.style.borderColor = "white";
                //         audioTrack.adjustUserPlaybackSignalVolume(uid, 50);
                //     }
                // }
              }
            }
          }
        }
      } else {
        gazeStartTime = null;
      }
    })
    .begin();
}
