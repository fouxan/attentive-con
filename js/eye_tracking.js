let userId = sessionStorage.getItem("uid");
let hasJoined = sessionStorage.getItem("has_joined");
// THRESHOLD_TIME is the amount of time in milliseconds that the user has to look at a video container before the focus switches to that user
const THRESHOLD_TIME = 3000;
// RESET_DELAY is the amount of time in milliseconds that the user has to look away from a video container before the gazeStartTime is reset
const RESET_DELAY = 500;
// COOLDOWN is the amount of time in milliseconds that the user has to wait before switching focus again
const COOLDOWN = 10000;
// variables to keep track of the gaze periods
let gazeStartTime = null;
let resetGazeTimeout = null;
let lastSwitchTime = null;
let currentFocusedGroup = null;

// isLookingAtElement returns true if the user is looking at the element located at the gazeData coordinates
function isLookingAtElement(gazeData, element) {
  if (element.id === `user-container-${userId}`) return false;
  if (
    typeof element === "object" &&
    element !== null &&
    "getBoundingClientRect" in element
  ) {
    const elementRect = element.getBoundingClientRect();
    const gazeX = gazeData.x;
    const gazeY = gazeData.y;

    return (looking =
      gazeX >= elementRect.left - 100 &&
      gazeX <= elementRect.right + 100 &&
      gazeY >= elementRect.top - 100 &&
      gazeY <= elementRect.bottom + 100);
  }
  return false;
}

// focusOnUser focuses on the user with the given uid i.e, groups object, volume and border color are updated and
// sends a 'focus' channel message to the target user and 'group_update' channel message to all users to notify everyone about the change
async function focusOnUser(uid) {
  console.log("Focusing on user: ", uid);

  for(let userId in groups){
    let index = groups[userId].indexOf(userId);
    if(index !== -1){
      groups[userId].splice(index, 1);
    }
  }

  // Update the groups for all remaining users in each group
  for(let userId in groups){
    for(let remainingUserId of groups[userId]){
      groups[remainingUserId] = [...groups[userId]];
    }
  }

  // Remove the focusing user's own group
  delete groups[userId];

  let focusedUserGroup = groups[uid];

  if (!focusedUserGroup) {
    groups[uid] = [uid, userId];
    groups[userId] = [uid, userId];
  } else {
    focusedUserGroup.push(userId);

    for (let userId of focusedUserGroup) {
      groups[userId] = [...focusedUserGroup];
    }
  }

  updateVolumeAndBorderColor();

  await channel.sendMessage({
    text: JSON.stringify({
      type: "focus",
      from: userId,
      to: uid,
    }),
  });
}

// startEyeTracking starts the eye tracking and sets the gaze listener
// if the user is looking at a video container for more than THRESHOLD_TIME, a confirmation dialog is shown to the user
// if the user confirms, the focus is switched to the user in the video container via call to the focusOnUser function
// the gazeStartTime is reset if the user looks away from the video container for more than RESET_DELAY
// the gazeStartTime is reset if the user switches focus to another user
// on focusing or cancelling focus a a user will have to wait for COOLDOWN time before switching focus again
function startEyeTracking() {
  webgazer
    .setGazeListener(function (gazeData) {
      if (gazeData == null) {
        gazeStartTime = null;
        return;
      }
      let currentTime = new Date().getTime();
      if (lastSwitchTime && currentTime - lastSwitchTime < COOLDOWN) return;

      let videoContainers = document.getElementsByClassName("video__container");
      for (container of videoContainers) {
        if (isLookingAtElement(gazeData, container)) {
          if (gazeStartTime === null) {
            gazeStartTime = new Date().getTime();
          } else {
            const gazeDuration = new Date().getTime() - gazeStartTime;
            if (gazeDuration >= THRESHOLD_TIME) {
              let focusId = container.id.split("-")[2];
              console.log(`User ${userId} is looking at ${container.id}`);
              if (
                !container.classList.contains("focused-user") &&
                userId !== focusId
              ) {
                console.log(users);
                let focusName = users[focusId].name;
                let userWantsToFocus = confirm(
                  `Do you want to switch focus to ${focusName}?`
                );
                if (userWantsToFocus) {
                  focusOnUser(focusId);
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
    })
    .begin();

  webgazer.showVideoPreview(false).showPredictionPoints(true);
}

// wait for user to join before starting eye tracking
let checkJoinedInterval = setInterval(() => {
  hasJoined = sessionStorage.getItem("has_joined");
  userId = sessionStorage.getItem("uid");
  if (userId && hasJoined && hasJoined === "true") {
    clearInterval(checkJoinedInterval);
    console.log("User has joined");
    startEyeTracking();
  }
}, 1000);
