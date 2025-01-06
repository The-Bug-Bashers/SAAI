document.addEventListener("DOMContentLoaded", function () {
 
    fetchAndDisplayTimetable(document.getElementById("timetableDiv"), true).then(() => {
        document.getElementById('loadingMessage').style.display = 'none';
    });
});