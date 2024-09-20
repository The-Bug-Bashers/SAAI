const apiUrl = 'https://saai.wayshare.de:9090';

// Utility function to make HTTP GET requests
async function fetchApi(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error fetching data');
    return response.json();
}

// Fetch active alerts and handle UI display
async function fetchActiveAlerts() {
    try {
        const activeAlerts = await fetchApi(`${apiUrl}/api/alerts/active`);
        const activeAlarmsDiv = document.getElementById('activeAlarms');
        const loadingMessage = document.getElementById('loadingMessage');
        loadingMessage.style.display = 'none'; // Hide loading message

        if (activeAlerts.length > 0) {
            activeAlarmsDiv.innerHTML = '<h2>Aktive Alarme</h2>';
            activeAlerts.forEach(alert => {
                const alarmElement = document.createElement('div');
                alarmElement.textContent = `Raum: ${alert.room}, Beschreibung: ${alert.description}`;
                activeAlarmsDiv.appendChild(alarmElement);
            });
        } else {
            activeAlarmsDiv.innerHTML = '<p>Keine aktiven Alarme.</p>';
        }

        // Show the form after fetching active alerts
        document.getElementById('alertform').style.display = 'block';
    } catch (error) {
        console.error('Error fetching active alerts:', error);
        document.getElementById('errorMessage').style.display = 'block'; // Show error message
    }
}

// Fetch user list and display them sorted by experience
async function fetchUsers() {
    try {
        const users = await fetchApi(`${apiUrl}/api/users`);
        const userListDiv = document.getElementById('userList');
        userListDiv.innerHTML = ''; // Clear any previous content

        // Sort users by experience
        users.sort((a, b) => a.experience.localeCompare(b.experience));

        // Display each user in the list
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.classList.add('userRow');
            userElement.dataset.uuid = user.uuid;

            // Display user details
            userElement.innerHTML = `
                <input type="checkbox" style="display:none;" class="userCheckbox" data-uuid="${user.uuid}">
                <strong>${user.username}</strong> (${user.experience}) - ${user.telephoneNumber}
            `;

            // Allow row selection
            userElement.addEventListener('click', function () {
                const checkbox = userElement.querySelector('.userCheckbox');
                checkbox.checked = !checkbox.checked; // Toggle checkbox
                userElement.classList.toggle('selected'); // Toggle visual state
            });

            userListDiv.appendChild(userElement);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        document.getElementById('errorMessage').style.display = 'block'; // Show error message
    }
}

// Send alert with selected users
async function sendAlert() {
    const selectedUsers = Array.from(document.querySelectorAll('.userCheckbox:checked'))
        .map(checkbox => checkbox.dataset.uuid);

    const room = document.getElementById('room').value;
    const description = document.getElementById('description').value;

    const data = {
        room: room,
        description: `Nachalarmierung: ${description}`,
        users: selectedUsers
    };

    try {
        const response = await fetch(`${apiUrl}/api/alerts/single`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Alarm erfolgreich gesendet');
        } else {
            alert('Fehler beim Senden des Alarms');
        }
    } catch (error) {
        console.error('Error sending alert:', error);
    }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", function () {
    const alertButton = document.getElementById('alertButton');
    const sendAlertButton = document.getElementById('sendAlertButton');

    // Fetch active alerts when the page loads
    fetchActiveAlerts();

    alertButton.addEventListener('click', function () {
        document.getElementById('alertform').style.display = 'none';
        document.getElementById('userSelection').style.display = 'block';
        fetchUsers(); // Fetch users after room and description are filled
    });

    sendAlertButton.addEventListener('click', sendAlert);
});
