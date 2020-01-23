/*
 * If not stated otherwise in this file or this component's license file the
 * following copyright and licenses apply:
 *
 * Copyright 2018 RDK Management
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

var playbackSpeeds = [-64, -32, -16, -4, 1, 4, 16, 32, 64];

class VTTCue {
    constructor(start, duration, text, line = 0, align = "", position = 0, size = 0) {
        this.start = start;       //: number,
        this.duration = duration; //: number,
        this.text = text;         //: string,
        this.line = line;         //: number,
        this.align = align;       //: string,
        this.size = size;         //: number,
        this.position = position  //: number
	}
    
};

let subtitleTimer = undefined;
let displayTimer = undefined;
let vttCueBuffer = [];

//Comcast DRM config for AAMP
var comcastDrmConfig = {'com.microsoft.playready':'mds.ccp.xcal.tv', 'com.widevine.alpha':'mds.ccp.xcal.tv', 'preferredKeysystem':'com.widevine.alpha'};

//AAMP initConfig is used to pass certain predefined config params to AAMP
//Commented out values are not implemented for now
//Values assigned are default values of each config param
//All properties are optional.
var defaultInitConfig = {
    /**
     * max initial bitrate (kbps)
     */
    initialBitrate: 2500000,

    /**
     * min amount of buffer needed before playback (seconds)
     */
    //initialBuffer: number;

    /**
     * max amount of buffer during playback (seconds)
     */
    //playbackBuffer: number;

    /**
     * start position for playback (ms)
     */
    offset: 15,

    /**
     * network request timeout (ms)
     */
    networkTimeout: 10,

    /**
     * max amount of time to download ahead of playhead (seconds)
     * e.x:
     *   with a downloadBuffer of 10s there will be 10 seconds of
     *   video or audio stored in javascript memory and not in a
     *   playback buffer
     */
    //downloadBuffer: number;

    /**
     * min amount of bitrate (kbps)
     */
    //minBitrate: number;

    /**
     * max amount of bitrate (kbps)
     */
    //maxBitrate: number;

    /**
     * preferred audio language
     */
    preferredAudioLanguage: "en",

    /**
     * TSB length in seconds, value of 0 means it is disabled
     */
    //timeShiftBufferLength: number;

    /**
     * offset from live point for live assets (in secs)
     */
    liveOffset: 15,

	/**
     * drmConfig for the playback
     */

    drmConfig: comcastDrmConfig //For sample structure comcastDrmConfig
};

var playerState = playerStatesEnum.idle;
var playbackRateIndex = playbackSpeeds.indexOf(1);
var urlIndex = 0;
var mutedStatus = false;
var playerObj = null;

window.onload = function() {
    initPlayerControls();
    resetPlayer();
    resetUIOnNewAsset();

    //loadUrl(urls[urlIndex]);
}

function resetSubtitles(emptyBuffers) {
    if (displayTimer !== undefined) {
        clearTimeout(displayTimer);
        displayTimer = undefined;
    }
    if (subtitleTimer !== undefined) {
        clearTimeout(subtitleTimer);
        subtitleTimer = undefined;
    }
    document.getElementById("subtitleText").innerHTML = "";
    //Empty all cues
    if (emptyBuffers === true) {
        vttCueBuffer = [];
    }
}

function displaySubtitle(cue, positionMS) {
    var timeOffset = cue.start - positionMS;
    console.log("webvtt timeOffset: " + timeOffset + " cue: " + JSON.stringify(cue));
    if (timeOffset <= 200) {
        //no need of timer
        vttCueBuffer.shift();
        document.getElementById("subtitleText").innerHTML = cue.text;
        subtitleTimer = setTimeout(function() {
            document.getElementById("subtitleText").innerHTML = "";
            if (vttCueBuffer.length > 0) {
                displaySubtitle(vttCueBuffer[0], positionMS + cue.duration + timeOffset);
            } else {
                displayTimer = undefined;
                subtitleTimer = undefined;
            }
        }, cue.duration + timeOffset);
    } else {
        displayTimer = setTimeout(function() {
            displaySubtitle(cue, positionMS + timeOffset - 200);
        }, timeOffset - 200);
    }
}

function webvttDataHandler(event) {
    console.log("webvtt data listener event: " + JSON.stringify(event));
    var bufferLength = vttCueBuffer.length;
    if (bufferLength > 0) {
        var lastCue = vttCueBuffer[bufferLength - 1];
        var subText = event.text.replace(/\n/g, "<br />");
        if (lastCue.start !== event.start && lastCue.duration !== event.duration && lastCue.text !== subText) {
            console.log("Pushing cue to buffer: " + JSON.stringify(event));
            vttCueBuffer.push(new VTTCue(event.start, event.duration, subText));
        }
    }
    vttCueBuffer.push(new VTTCue(event.start, event.duration, event.text));
}

function playbackStateChanged(event) {
    console.log("Playback state changed event: " + JSON.stringify(event));
    switch (event.state) {
        case playerStatesEnum.idle:
            playerState = playerStatesEnum.idle;
            break;
        case playerStatesEnum.initializing:
            playerState = playerStatesEnum.initializing;
            break;
        case playerStatesEnum.playing:
            playerState = playerStatesEnum.playing;
            break;
        case playerStatesEnum.paused:
            playerState = playerStatesEnum.paused;
            break;
        case playerStatesEnum.seeking:
            playerState = playerStatesEnum.seeking;
            break;
        default:
            console.log("State not expected");
            break;
    }
    console.log("Player state is: " + playerState);
}

function mediaEndReached() {
    console.log("Media end reached event!");
    loadNextAsset();
}

function mediaSpeedChanged(event) {
    console.log("Media speed changed event: " + JSON.stringify(event));
    var currentRate = event.speed;
    console.log("Speed Changed [" + playbackSpeeds[playbackRateIndex] + "] -> [" + currentRate + "]");

    if (currentRate != undefined) {
        //Stop vtt rendering
        if (currentRate !== 1) {
            resetSubtitles(currentRate !== 0);
        }

        if (currentRate != 0) {
            playbackRateIndex = playbackSpeeds.indexOf(currentRate);
        } else {
            playbackRateIndex = playbackSpeeds.indexOf(1);
        }
        if (currentRate != 0 && currentRate != 1){
            showTrickmodeOverlay(currentRate);
        }

        if (currentRate === 1) {
            document.getElementById("playOrPauseIcon").src = "../icons/pause.png";
        } else {
            document.getElementById("playOrPauseIcon").src = "../icons/play.png";
        }
    }
}

function bitrateChanged(event) {
    console.log("bitrate changed event: " + JSON.stringify(event));
}

function mediaPlaybackFailed(event) {
    console.log("Media failed event: " + JSON.stringify(event));
    loadNextAsset();
}

function mediaMetadataParsed(event) {
    console.log("Media metadata event: " + JSON.stringify(event));
}

function subscribedTagNotifier(event) {
    console.log("Subscribed tag notifier event: " + JSON.stringify(event));
}

function mediaProgressUpdate(event) {
    //console.log("Media progress update event: " + JSON.stringify(event));
    var duration = event.durationMiliseconds;
    var position = event.positionMiliseconds;
    var value = ( position / duration ) * 100;
	var seekBar = document.getElementById("seekBar");

    if(displayTimer === undefined && subtitleTimer === undefined && vttCueBuffer.length !== 0 && event.playbackSpeed === 1) {
        vttCueBuffer = vttCueBuffer.filter((cue) => {
            return cue.start > (position - 200);
        });
        console.log("Media progress: positionMiliseconds=" + event.positionMiliseconds + " cueBufferLength: " + vttCueBuffer.length);
        displaySubtitle(vttCueBuffer[0], position);
/*		
        var vttCue = vttCueBuffer[0];
		console.log("webvtt cue: " + JSON.stringify(vttCue));
        // remove the current subtitle from the cue
        vttCueBuffer.shift();
        // start the timer to display the subtitle
        if (vttCue.start - position > 0) {
			console.log("start cue timer: " + vttCue.start - position);
            displayTimer = setTimeout(displaySubtitle, vttCue.start - position);
        }
        
        function displaySubtitle() {
            document.getElementById("subtitleText").innerHTML = vttCue.text;
            displayTimer = undefined;
            // start the timer to delete the subtitle
            setTimeout(deleteSubtitle, vttCue.duration);
        }

        function deleteSubtitle() {
            document.getElementById("subtitleText").innerHTML = "";
        }
*/
    }

    document.getElementById("totalDuration").innerHTML = convertSStoHr(duration / 1000.0);
    document.getElementById("currentDuration").innerHTML = convertSStoHr(position / 1000.0);
    console.log("Media progress update event: value=" + value);
    // Update the slider value
    if(isFinite(value)) {
        seekBar.value = value;
        seekBar.style.width = value+"%";
        seekBar.style.backgroundColor = "red";
    }
}

function mediaPlaybackStarted() {
    document.getElementById("playOrPauseIcon").src = "../icons/pause.png";

    var availableVBitrates = playerObj.getVideoBitrates();
    if (availableVBitrates !== undefined) {
        createBitrateList(availableVBitrates);
    }
}

function mediaPlaybackBuffering(event) {
    if (event.buffering === true){
        //bufferingDisplay(true);
    } else {
        //bufferingDisplay(false);
    }
}

function mediaDurationChanged(event) {
    console.log("Duration changed!");
}

function decoderHandleAvailable(event) {
    console.log("decoderHandleAvailable " + event.decoderHandle);
    XREReceiver.onEvent("onDecoderAvailable", { decoderHandle: event.decoderHandle });
}

// helper functions
function resetPlayer() {
    resetSubtitles(true);
	
    if (playerState !== playerStatesEnum.idle) {
        playerObj.stop();
    }
    if (playerObj !== null) {
        playerObj.destroy();
        playerObj = null;
    }

    playerObj = new AAMPPlayer();
    playerObj.addEventListener("playbackStateChanged", playbackStateChanged);
    playerObj.addEventListener("playbackCompleted", mediaEndReached);
    playerObj.addEventListener("playbackSpeedChanged", mediaSpeedChanged);
    playerObj.addEventListener("bitrateChanged", bitrateChanged);
    playerObj.addEventListener("playbackFailed", mediaPlaybackFailed);
    playerObj.addEventListener("mediaMetadata", mediaMetadataParsed);
    playerObj.addEventListener("timedMetadata", subscribedTagNotifier);
    playerObj.addEventListener("playbackProgressUpdate", mediaProgressUpdate);
    playerObj.addEventListener("playbackStarted", mediaPlaybackStarted);
    //playerObj.addEventListener("bufferingChanged", mediaPlaybackBuffering);
    playerObj.addEventListener("durationChanged", mediaDurationChanged);
    playerObj.addEventListener("decoderAvailable", decoderHandleAvailable);
    playerObj.addEventListener("vttCueDataListener", webvttDataHandler);
    playerState = playerStatesEnum.idle;
    mutedStatus = false;
}

function loadUrl(urlObject) {
	console.log("UrlObject received: " + urlObject);
    if (urlObject.useComcastDrmConfig === true) {
        playerObj.initConfig(defaultInitConfig);
        playerObj.load(urlObject.url);
    } else {
        var initConfiguration = defaultInitConfig;
        initConfiguration.drmConfig = null;
        playerObj.load(urlObject.url);
    }
}
