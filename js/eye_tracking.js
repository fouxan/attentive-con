window.saveDataAcrossSessions = true

const THRESHOLD_TIME = 1000 // 1 second
const LEFT_CUTOFF = window.innerWidth / 4
const RIGHT_CUTOFF = window.innerWidth - window.innerWidth / 4



let startLookTime = Number.POSITIVE_INFINITY
let lookDirection = null

webgazer.setGazeListener((data, timestamp) => {
    if (data == null || lookDirection === "STOP") return
    startLookTime = timestamp
    if(startLookTime + THRESHOLD_TIME < timestamp){
        videoElement = document.elementFromPoint(data.x, data.y)
        console.log(videoElement)
        shiftFocus('none')
    }

    // if (
    //   data.x < LEFT_CUTOFF &&
    //   lookDirection !== "LEFT" &&
    //   lookDirection !== "RESET"
    // ) {
    //   startLookTime = timestamp
    //   lookDirection = "LEFT"
    // } else if (
    //   data.x > RIGHT_CUTOFF &&
    //   lookDirection !== "RIGHT" &&
    //   lookDirection !== "RESET"
    // ) {
    //   startLookTime = timestamp
    //   lookDirection = "RIGHT"
    // } else if (data.x >= LEFT_CUTOFF && data.x <= RIGHT_CUTOFF) {
    //   startLookTime = Number.POSITIVE_INFINITY
    //   lookDirection = null
    // }

    // if (startLookTime + LOOK_DELAY < timestamp) {
    //   if (lookDirection === "LEFT") {
    //     imageElement.classList.add("left")
    //   } else {
    //     imageElement.classList.add("right")
    //   }

    //   startLookTime = Number.POSITIVE_INFINITY
    //   lookDirection = "STOP"
    //   setTimeout(() => {
    //     imageElement.remove()
    //     nextImageElement.classList.remove("next")
    //     imageElement = nextImageElement
    //     nextImageElement = getNewImage(true)
    //     lookDirection = "RESET"
    //   }, 200)
    // }
}).begin()

function shiftFocus(user) {
  if(user === 'none'){
    console.log("changing focus to only host.")
  }else if(user === 'one'){
    console.log("changing focus to host and one")
  }else if(user === 'two'){
    console.log("changing focus to host and two")
  }else if(user === 'three'){
    console.log("changing focus to host and three")
  }else if(user === 'four'){
    console.log("changing focus to host and four")
  }else{
    console.log("host looked away")
  }
}