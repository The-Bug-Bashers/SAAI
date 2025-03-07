const alertId = new URLSearchParams(window.location.search).get('alert_id');

document.addEventListener("DOMContentLoaded", function() {
        if (!alertId) {
        displayError("Dein alarm konnte nicht überwacht werden, es sind aber trotzdem Schulsanitäter auf dem weg", `No valid alert Id found (alert Id: ${alertId}).<br><br>`, true);
        return;
    }

    setInterval(fetchAcceptedUsers, 5000); // Fetch every 5 seconds

    fetchAndDisplayTimetable(document.getElementById('timetableDiv'), true)
        .then(() => {
            document.getElementById('loadingMessage').style.display = 'none';
        })
});

function fetchAcceptedUsers() {
    const acceptedUsersContainer = document.getElementById('acceptedParamedicsContainer');
    let alertAccepted = false;

    fetch(`${acceptedUsersApiUrl}/` + alertId)
        .then(response => response.json())
        .then(data => {

            if (data.includes('none') && data.length === 1) {
                acceptedUsersContainer.innerHTML = '<p>Bisher hat noch kein Sanitäter den Alarm angenommen, dies dauert normalerweise 10 – 90 Sekunden.</p>';
            } else {
                let validUsers = data.filter(user => user && typeof user === 'string'); // Filter valid user names

                if (!alertAccepted) {
                    document.title = "Alarm angenommen";
                    alertAccepted = true;
                }

                let message;
                if (validUsers.length === 1) {
                    message = `${validUsers[0]} hat den Alarm angenommen und ist auf dem Weg zu dir.`;
                } else if (validUsers.length === 2) {
                    message = `${validUsers[0]} und ${validUsers[1]} haben den Alarm angenommen und sind auf dem Weg zu dir.`;
                } else {
                    const lastUser = validUsers.pop();
                    message = `${validUsers.join(', ')} und ${lastUser} haben den Alarm angenommen und sind auf dem Weg zu dir.`;
                }

                acceptedUsersContainer.innerHTML = message;
            }
        })
        .catch(error => {
            console.error('Error fetching accepted users:', error);
            acceptedUsersContainer.innerHTML = '<p style="color: red;">Fehler beim Laden der angenommenen Benutzer. (Bitte warten)</p>';
            fetch(`${livetickerApiUrl}?message=WARNING:+Scheduled+update+not+received%0ASite:+${window.location.pathname}%0AError:+Error+fetching+accepted+users`);

        });
}
