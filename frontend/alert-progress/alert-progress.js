document.addEventListener("DOMContentLoaded", function() {
    const acceptedUsersContainer = document.getElementById('paramedicsResponse');
    const successMessage = document.getElementById('successMessage');
    let alertAccepted = false; // Keep track of whether the alert has been accepted

    // Extract alert_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const alertId = urlParams.get('alert_id');

    if (!alertId) {
        acceptedUsersContainer.innerHTML = '<p style="color: red; text-shadow: 2px 2px 5px rgba(0, 0, 0, 100%);">Keine gültige Alarm-ID gefunden.</p>';
        return;
    }

    // Function to fetch accepted users
    function fetchAcceptedUsers() {
        fetch(`https://saai.wayshare.de:9090/api/alerts/accepted-users/${alertId}`)
            .then(response => response.json())
            .then(data => {
                // Log the API response for debugging
                console.log('API response:', data);

                // Check if any users accepted the alert
                if (Array.isArray(data) && data.length > 0) {
                    let validUsers = data.filter(user => user && typeof user === 'string'); // Filter valid user names
                    let message = '';

                    // Change title to "Alarm angenommen" if not already changed
                    if (!alertAccepted) {
                        document.title = "Alarm angenommen";
                        alertAccepted = true; // Mark as accepted
                    }

                    // Different messages depending on how many paramedics accepted
                    if (validUsers.length === 1) {
                        message = `${validUsers[0]} hat den Alarm angenommen und ist auf dem Weg zu dir.`;
                    } else if (validUsers.length === 2) {
                        message = `${validUsers[0]} und ${validUsers[1]} haben den Alarm angenommen und sind auf dem Weg zu dir.`;
                    } else if (validUsers.length >= 3) {
                        message = `${validUsers[0]}, ${validUsers[1]} und ${validUsers[2]} haben den Alarm angenommen und sind auf dem Weg zu dir.`;
                    }

                    // Display the message after the success message
                    acceptedUsersContainer.innerHTML = '<br>' + message;
                } else {
                    // No paramedics have accepted yet, clear the message and reset title
                    acceptedUsersContainer.innerHTML = '<p>Bisher hat noch kein Sanitäter den alarm angenommen. Dies dauert normalerweise 45 Sekunden.</p>';

                    if (alertAccepted) {
                        document.title = "Alarmierung läuft"; // Reset the title if necessary
                        alertAccepted = false;
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching accepted users:', error);
                acceptedUsersContainer.innerHTML = '<p style="color: red; text-shadow: 2px 2px 5px rgba(0, 0, 0, 100%);">Fehler beim Laden der angenommenen Benutzer.</p>';
            });
    }

    // Fetch users every second
    fetchAcceptedUsers(); // Initial fetch on page load
    setInterval(fetchAcceptedUsers, 1000); // Fetch every 1 second (1000 ms)
});
