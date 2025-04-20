document.addEventListener("DOMContentLoaded", function () {

    // Remove the timetable header once it has been loaded
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length) {
                const timetableHeader = document.getElementById("timetableHeader");
                if (timetableHeader) {
                    timetableHeader.style.display = "none";
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    fetchAndDisplayTimetable(document.getElementById("timetableDiv"), true).then(() => {
        document.getElementById('loadingMessage').style.display = 'none';
    });

    const params = new URLSearchParams(window.location.search);
    if (params.has("message")) {
        displayNotification(decodeURIComponent(params.get("message")));
    }
});