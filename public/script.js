// ========================================
// TERA PLAYER
// FINAL FRONTEND SCRIPT
// ========================================


// ========================================
// ELEMENTS
// ========================================

const extractBtn =
    document.getElementById("extractBtn");

const videoUrl =
    document.getElementById("videoUrl");

const urlInputBox =
    document.getElementById("urlInputBox");

const clearUrl =
    document.getElementById("clearUrl");

const message =
    document.getElementById("message");


const visitorCount =
    document.getElementById("visitorCount");

const processedCount =
    document.getElementById("processedCount");


const videoInfo =
    document.getElementById("videoInfo");

const playerSection =
    document.getElementById("playerSection");


const videoName =
    document.getElementById("videoName");

const videoSize =
    document.getElementById("videoSize");

const videoDuration =
    document.getElementById("videoDuration");

const videoQuality =
    document.getElementById("videoQuality");


const videoPlayer =
    document.getElementById("videoPlayer");


const themeToggle =
    document.getElementById("themeToggle");

const themeIcon =
    document.getElementById("themeIcon");


// ========================================
// DOWNLOAD ELEMENTS
// ========================================

const downloadSection =
    document.getElementById("downloadSection");

const downloadBtn =
    document.getElementById("downloadBtn");

const continueDownloadBtn =
    document.getElementById("continueDownloadBtn");


// ========================================
// GLOBAL STATE
// ========================================

let hls = null;

let currentDirectUrl = "";

let currentVideoName =
    "Tera Player Video";

let waitingForAdReturn =
    false;

let adWindow = null;


// ========================================
// ADSTERRA SMARTLINK
// ========================================

const ADSTERRA_SMARTLINK =
    "https://directyp.org/4/eabbdade67a81b33cec1352ecdfe67a3";


// ========================================
// STATUS MESSAGE HELPER
// ========================================

function setMessage(
    text = "",
    type = ""
) {

    message.textContent = text;

    message.className = "message";


    if (type) {

        message.classList.add(
            `status-${type}`
        );
    }
}


// ========================================
// URL INPUT STATE
// ========================================

function updateUrlInputState() {

    if (!urlInputBox || !videoUrl) {
        return;
    }


    const hasValue =
        videoUrl.value.trim().length > 0;


    urlInputBox.classList.toggle(
        "has-value",
        hasValue
    );
}


// ========================================
// INPUT EVENT
// ========================================

videoUrl.addEventListener(
    "input",
    () => {

        updateUrlInputState();

    }
);


// ========================================
// PASTE EVENT
// ========================================

videoUrl.addEventListener(
    "paste",
    () => {

        setTimeout(
            () => {

                updateUrlInputState();


                if (!urlInputBox) {
                    return;
                }


                urlInputBox.classList.remove(
                    "paste-success"
                );


                void urlInputBox.offsetWidth;


                urlInputBox.classList.add(
                    "paste-success"
                );


                setTimeout(
                    () => {

                        urlInputBox.classList.remove(
                            "paste-success"
                        );

                    },
                    400
                );

            },
            50
        );
    }
);


// ========================================
// CLEAR URL
// ========================================

clearUrl.addEventListener(
    "click",
    () => {

        videoUrl.value = "";

        updateUrlInputState();

        setMessage();

        videoUrl.focus();

    }
);


// Initial input state
updateUrlInputState();


// ========================================
// THEME SYSTEM
// ========================================

function applyTheme(theme) {

    if (
        theme !== "light" &&
        theme !== "dark"
    ) {

        theme = "dark";
    }


    document.documentElement.setAttribute(
        "data-theme",
        theme
    );


    if (theme === "dark") {

        themeIcon.textContent =
            "☀️";


        themeToggle.setAttribute(
            "aria-label",
            "Switch to light mode"
        );


        themeToggle.setAttribute(
            "title",
            "Switch to light mode"
        );

    } else {

        themeIcon.textContent =
            "🌙";


        themeToggle.setAttribute(
            "aria-label",
            "Switch to dark mode"
        );


        themeToggle.setAttribute(
            "title",
            "Switch to dark mode"
        );
    }


    const themeColor =
        document.querySelector(
            'meta[name="theme-color"]'
        );


    if (themeColor) {

        themeColor.setAttribute(
            "content",
            theme === "dark"
                ? "#080b12"
                : "#f5f7fb"
        );
    }
}


// ========================================
// LOAD SAVED THEME
// ========================================

const savedTheme =
    localStorage.getItem(
        "tera_player_theme"
    );


applyTheme(
    savedTheme === "light"
        ? "light"
        : "dark"
);


// ========================================
// THEME TOGGLE
// ========================================

themeToggle.addEventListener(
    "click",
    () => {

        const currentTheme =
            document.documentElement.getAttribute(
                "data-theme"
            );


        const newTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";


        applyTheme(newTheme);


        localStorage.setItem(
            "tera_player_theme",
            newTheme
        );

    }
);


// ========================================
// VISITOR ID
// ========================================

let visitorId =
    localStorage.getItem(
        "tera_player_visitor_id"
    );


if (!visitorId) {

    if (
        window.crypto &&
        typeof crypto.randomUUID === "function"
    ) {

        visitorId =
            crypto.randomUUID();

    } else {

        visitorId =
            "visitor-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2);
    }


    localStorage.setItem(
        "tera_player_visitor_id",
        visitorId
    );
}


// ========================================
// LOAD STATISTICS
// ========================================

async function loadStats() {

    try {

        const response =
            await fetch(
                "/api/stats",
                {
                    headers: {
                        "X-Visitor-ID":
                            visitorId
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Stats request failed"
            );
        }


        const data =
            await response.json();


        if (!data.success) {
            return;
        }


        visitorCount.textContent =
            Number(
                data.visitors || 0
            ).toLocaleString();


        processedCount.textContent =
            Number(
                data.processed || 0
            ).toLocaleString();


        if (data.visitorId) {

            visitorId =
                data.visitorId;


            localStorage.setItem(
                "tera_player_visitor_id",
                visitorId
            );
        }

    } catch (error) {

        console.error(
            "Stats error:",
            error
        );
    }
}


loadStats();


// ========================================
// FORMAT DURATION
// ========================================

function formatDuration(seconds) {

    if (
        seconds === null ||
        seconds === undefined ||
        seconds === ""
    ) {

        return "-";
    }


    seconds = Number(seconds);


    if (!Number.isFinite(seconds)) {

        return "-";
    }


    const hours =
        Math.floor(
            seconds / 3600
        );


    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );


    const secs =
        Math.floor(
            seconds % 60
        );


    if (hours > 0) {

        return `${hours}:${String(
            minutes
        ).padStart(2, "0")}:${String(
            secs
        ).padStart(2, "0")}`;
    }


    return `${minutes}:${String(
        secs
    ).padStart(2, "0")}`;
}


// ========================================
// RESET PLAYER
// ========================================

function resetPlayer() {

    if (hls) {

        try {

            hls.destroy();

        } catch (error) {

            console.error(
                "HLS destroy error:",
                error
            );
        }


        hls = null;
    }


    videoPlayer.pause();


    videoPlayer.removeAttribute(
        "src"
    );


    videoPlayer.load();
}


// ========================================
// PLAY HLS
// ========================================

function playHLS(
    streamUrl,
    directUrl
) {

    if (!streamUrl) {

        playDirectVideo(
            directUrl
        );

        return;
    }


    // ====================================
    // HLS.JS
    // ====================================

    if (
        window.Hls &&
        Hls.isSupported()
    ) {

        console.log(
            "Using HLS.js"
        );


        hls =
            new Hls({

                enableWorker: true,

                lowLatencyMode: false,

                backBufferLength: 90,

                maxBufferLength: 30,

                maxMaxBufferLength: 60

            });


        hls.loadSource(
            streamUrl
        );


        hls.attachMedia(
            videoPlayer
        );


        hls.on(
            Hls.Events.MANIFEST_PARSED,
            () => {

                console.log(
                    "HLS manifest loaded"
                );


                setMessage(
                    "Video ready. Starting playback...",
                    "loading"
                );


                videoPlayer
                    .play()

                    .then(() => {

                        console.log(
                            "Playback started"
                        );

                    })

                    .catch(() => {

                        setMessage(
                            "Video ready. Tap the play button."
                        );

                    });

            }
        );


        hls.on(
            Hls.Events.ERROR,
            (
                event,
                data
            ) => {

                console.error(
                    "HLS error:",
                    data
                );


                if (!data.fatal) {
                    return;
                }


                console.log(
                    "Fatal HLS error. Trying direct video..."
                );


                if (hls) {

                    hls.destroy();

                    hls = null;
                }


                playDirectVideo(
                    directUrl
                );

            }
        );


        return;
    }


    // ====================================
    // NATIVE HLS
    // ====================================

    if (
        videoPlayer.canPlayType(
            "application/vnd.apple.mpegurl"
        )
    ) {

        console.log(
            "Using native HLS"
        );


        videoPlayer.src =
            streamUrl;


        videoPlayer.addEventListener(
            "loadedmetadata",

            () => {

                videoPlayer
                    .play()

                    .catch(() => {

                        setMessage(
                            "Video ready. Tap the play button."
                        );

                    });

            },

            {
                once: true
            }
        );


        videoPlayer.onerror =
            () => {

                console.error(
                    "Native HLS playback failed"
                );


                playDirectVideo(
                    directUrl
                );

            };


        return;
    }


    // ====================================
    // DIRECT FALLBACK
    // ====================================

    playDirectVideo(
        directUrl
    );
}


// ========================================
// DIRECT VIDEO
// ========================================

function playDirectVideo(url) {

    if (!url) {

        setMessage(
            "No playable video URL was returned.",
            "error"
        );

        return;
    }


    console.log(
        "Trying direct video..."
    );


    resetPlayer();


    videoPlayer.src =
        url;


    videoPlayer.load();


    videoPlayer
        .play()

        .then(() => {

            console.log(
                "Direct playback started"
            );


            setMessage(
                "Video playback started.",
                "success"
            );

        })

        .catch(() => {

            setMessage(
                "Video ready. Tap the play button."
            );

        });


    videoPlayer.onerror =
        () => {

            console.error(
                "Direct video playback error:",
                videoPlayer.error
            );


            setMessage(
                "Video playback failed. The streaming server may be blocking browser playback.",
                "error"
            );

        };
}


// ========================================
// DOWNLOAD SECTION
// ========================================

function showDownloadSection(
    directUrl,
    filename
) {

    currentDirectUrl =
        directUrl || "";


    currentVideoName =
        filename ||
        "Tera Player Video";


    if (
        !downloadSection ||
        !currentDirectUrl
    ) {

        return;
    }


    downloadSection.classList.remove(
        "hidden"
    );


    downloadBtn.classList.remove(
        "hidden"
    );


    continueDownloadBtn.classList.add(
        "hidden"
    );


    continueDownloadBtn.disabled =
        false;


    continueDownloadBtn.innerHTML =
        "<span>⬇️</span>" +
        "<span>Continue Download</span>";
}


// ========================================
// OPEN SMARTLINK
// ========================================

function openSmartLink() {

    if (!currentDirectUrl) {

        setMessage(
            "Download link is not available.",
            "error"
        );

        return;
    }


    waitingForAdReturn =
        true;


    setMessage(
        "Advertisement opened. Return here to continue your download.",
        "loading"
    );


    /*
     * SmartLink is opened in a new tab.
     *
     * This keeps Tera Player alive in the
     * original tab.
     */

    try {

        adWindow =
            window.open(
                ADSTERRA_SMARTLINK,
                "_blank",
                "noopener"
            );

    } catch (error) {

        console.error(
            "SmartLink open error:",
            error
        );

        adWindow = null;
    }


    /*
     * If browser blocks new tab,
     * show Continue Download button
     * so the user is never stuck.
     */

    if (!adWindow) {

        waitingForAdReturn =
            false;


        downloadBtn.classList.add(
            "hidden"
        );


        continueDownloadBtn.classList.remove(
            "hidden"
        );


        setMessage(
            "Advertisement could not open automatically. Continue when ready.",
            "loading"
        );

        return;
    }


    downloadBtn.classList.add(
        "hidden"
    );
}


// ========================================
// DOWNLOAD BUTTON
// ========================================

if (downloadBtn) {

    downloadBtn.addEventListener(
        "click",
        () => {

            openSmartLink();

        }
    );
}


// ========================================
// USER RETURNS FROM AD
// ========================================

function handleAdReturn() {

    if (!waitingForAdReturn) {
        return;
    }


    /*
     * Do not immediately show the button.
     * Give the browser a small moment after
     * returning from the ad tab.
     */

    waitingForAdReturn =
        false;


    setTimeout(
        () => {

            continueDownloadBtn.classList.remove(
                "hidden"
            );


            setMessage(
                "Welcome back. Continue your download below.",
                "success"
            );

        },
        500
    );
}


// ========================================
// VISIBILITY CHANGE
// ========================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            handleAdReturn();
        }

    }
);


// ========================================
// PAGE SHOW
// ========================================

window.addEventListener(
    "pageshow",
    () => {

        handleAdReturn();

    }
);


// ========================================
// ACTUAL DOWNLOAD
// ========================================

function continueDownload() {

    if (!currentDirectUrl) {

        setMessage(
            "Download URL is not available.",
            "error"
        );

        return;
    }


    continueDownloadBtn.disabled =
        true;


    continueDownloadBtn.innerHTML =
        "<span>⏳</span>" +
        "<span>Starting Download...</span>";


    setMessage(
        "Starting video download...",
        "loading"
    );


    /*
     * First try the browser download
     * attribute.
     */

    const link =
        document.createElement("a");


    link.href =
        currentDirectUrl;


    link.download =
        currentVideoName;


    link.target =
        "_blank";


    link.rel =
        "noopener";


    link.style.display =
        "none";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    /*
     * Some remote video servers ignore
     * the HTML download attribute.
     *
     * In that case the new tab gives the
     * browser a chance to handle the URL.
     */

    setTimeout(
        () => {

            continueDownloadBtn.disabled =
                false;


            continueDownloadBtn.innerHTML =
                "<span>⬇️</span>" +
                "<span>Continue Download</span>";


            setMessage(
                "Download request sent.",
                "success"
            );

        },
        1500
    );
}


// ========================================
// CONTINUE DOWNLOAD BUTTON
// ========================================

if (continueDownloadBtn) {

    continueDownloadBtn.addEventListener(
        "click",
        () => {

            continueDownload();

        }
    );
}


// ========================================
// START VIDEO
// ========================================

function startVideo(
    streamUrl,
    directUrl
) {

    resetPlayer();


    if (streamUrl) {

        playHLS(
            streamUrl,
            directUrl
        );

        return;
    }


    if (directUrl) {

        playDirectVideo(
            directUrl
        );

        return;
    }


    setMessage(
        "No playable video URL was returned.",
        "error"
    );
}


// ========================================
// EXTRACT VIDEO
// ========================================

extractBtn.addEventListener(
    "click",
    async () => {

        const url =
            videoUrl.value.trim();


        // ==================================
        // EMPTY URL
        // ==================================

        if (!url) {

            setMessage(
                "Please paste a share link.",
                "error"
            );


            videoUrl.focus();

            return;
        }


        // ==================================
        // BASIC URL VALIDATION
        // ==================================

        try {

            new URL(url);

        } catch {

            setMessage(
                "Please enter a valid URL.",
                "error"
            );


            videoUrl.focus();

            return;
        }


        // ==================================
        // RESET OLD RESULT
        // ==================================

        resetPlayer();


        videoInfo.classList.add(
            "hidden"
        );


        playerSection.classList.add(
            "hidden"
        );


        downloadSection.classList.add(
            "hidden"
        );


        currentDirectUrl =
            "";


        currentVideoName =
            "Tera Player Video";


        waitingForAdReturn =
            false;


        // ==================================
        // LOADING STATE
        // ==================================

        extractBtn.disabled =
            true;


        extractBtn.classList.add(
            "loading"
        );


        extractBtn.innerHTML =
            '<span class="extract-icon">⟳</span>' +
            '<span class="extract-text">Extracting...</span>';


        setMessage(
            "Extracting video information...",
            "loading"
        );


        try {

            // =================================
            // API REQUEST
            // =================================

            const response =
                await fetch(
                    "/api/extract",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                url: url
                            })
                    }
                );


            let data;


            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "Invalid response from server."
                );
            }


            // =================================
            // API ERROR
            // =================================

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Video extraction failed."
                );
            }


            const video =
                data.video;


            if (!video) {

                throw new Error(
                    "No video information returned."
                );
            }


            console.log(
                "Video information:",
                video
            );


            // =================================
            // VIDEO NAME
            // =================================

            videoName.textContent =
                video.name ||
                "Unknown Video";


            // =================================
            // VIDEO SIZE
            // =================================

            videoSize.textContent =
                video.size ||
                "-";


            // =================================
            // DURATION
            // =================================

            videoDuration.textContent =
                formatDuration(
                    video.duration
                );


            // =================================
            // QUALITY
            // =================================

            videoQuality.textContent =
                video.quality
                    ? `${video.quality}p`
                    : "-";


            // =================================
            // DOWNLOAD LINK
            // =================================

            showDownloadSection(
                video.directUrl,
                video.name
            );


            // =================================
            // SHOW INFORMATION
            // =================================

            videoInfo.classList.remove(
                "hidden"
            );


            // =================================
            // SHOW PLAYER
            // =================================

            playerSection.classList.remove(
                "hidden"
            );


            // =================================
            // SUCCESS
            // =================================

            setMessage(
                "Video extracted successfully.",
                "success"
            );


            // =================================
            // UPDATE STATS
            // =================================

            await loadStats();


            // =================================
            // PLAY
            // =================================

            startVideo(
                video.streamUrl,
                video.directUrl
            );


        } catch (error) {

            console.error(
                "Extraction error:",
                error
            );


            setMessage(
                error.message ||
                "Something went wrong while extracting the video.",
                "error"
            );


            videoInfo.classList.add(
                "hidden"
            );


            playerSection.classList.add(
                "hidden"
            );


            downloadSection.classList.add(
                "hidden"
            );

        } finally {

            extractBtn.disabled =
                false;


            extractBtn.classList.remove(
                "loading"
            );


            extractBtn.innerHTML =
                '<span class="extract-icon">▶</span>' +
                '<span class="extract-text">Extract Video</span>';

        }

    }
);


// ========================================
// ENTER KEY
// ========================================

videoUrl.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !extractBtn.disabled
        ) {

            event.preventDefault();

            extractBtn.click();

        }

    }
);


// ========================================
// VIDEO EVENTS
// ========================================

videoPlayer.addEventListener(
    "playing",
    () => {

        console.log(
            "Video is playing"
        );


        setMessage(
            "Video is playing.",
            "success"
        );

    }
);


videoPlayer.addEventListener(
    "waiting",
    () => {

        setMessage(
            "Buffering video...",
            "loading"
        );

    }
);


videoPlayer.addEventListener(
    "canplay",
    () => {

        console.log(
            "Video can play"
        );

    }
);


videoPlayer.addEventListener(
    "ended",
    () => {

        setMessage(
            "Video finished."
        );

    }
);


videoPlayer.addEventListener(
    "error",
    () => {

        console.error(
            "HTML5 video error:",
            videoPlayer.error
        );

    }
);