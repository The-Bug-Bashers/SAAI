document.addEventListener("DOMContentLoaded", function () {
 
    fetchAndDisplayTimetable(document.getElementById("timetableDiv"), true).then(() => {
        document.getElementById('loadingMessage').style.display = 'none';
    });

    const params = new URLSearchParams(window.location.search);
    if (params.has("message")) {
        displayNotification(decodeURIComponent(params.get("message")));
    }
});