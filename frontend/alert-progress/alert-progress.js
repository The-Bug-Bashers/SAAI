document.addEventListener("DOMContentLoaded", function() {
    const acceptedUsersContainer = document.getElementById('acceptedUsersContainer');
    const loadingMessage = document.getElementById('loadingMessage');

    // Extract alert_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const alertId = urlParams.get('alertid');

    if (!alertId) {
        acceptedUsersContainer.innerHTML = '<p style="color: red;">Keine gültige Alarm-ID gefunden.</p>';
        return;
    }

    // Fetch the accepted users for the alert
    fetch(`https://localhost:9090/api/alerts/accepted-users/${alertId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            loadingMessage.style.display = 'none';

            if (data.accepted_users && data.accepted_users.length > 0) {
                // Clear the container and add accepted users
                acceptedUsersContainer.innerHTML = '';
                data.accepted_users.forEach(user => {
                    const userElement = document.createElement('p');
                    userElement.textContent = `User: ${user.name} (${user.email})`;
                    acceptedUsersContainer.appendChild(userElement);
                });
            } else {
                acceptedUsersContainer.innerHTML = '<p>Keine Benutzer haben den Alarm angenommen.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching accepted users:', error);
            acceptedUsersContainer.innerHTML = '<p style="color: red;">Fehler beim Laden der angenommenen Benutzer.</p>';
            loadingMessage.style.display = 'none';
        });
});
