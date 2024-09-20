const apiUrl = 'https://saai.wayshare.de:9090';

// Utility function to make HTTP GET/POST requests
async function fetchApi(url, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
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
                const alertBox = document.createElement('div');
                alertBox.classList.add('timetable-row');

                alertBox.innerHTML = `
                    <div class="timetable-details">
                        <div><strong>Raum:</strong> ${alert.room}</div>
                        <div><strong>Beschreibung:</strong> ${alert.description}</div>
                    </div>
                    <button type="button" class="weiterButton">Weiter (Alarm)</button>
                `;

                // Attach an event listener to the Weiter button for this alert
                const weiterButton = alertBox.querySelector('.weiterButton');
                weiterButton.addEventListener('click', () => {
                    console.log(`Selected Alarm: Room = ${alert.room}, Description = ${alert.description}`);

                    // Fill in the form with the selected alert's room and description
                    document.getElementById('room').value = alert.room;
                    document.getElementById('description').value = alert.description;

                    // Hide the form and active alarms
                    document.getElementById('alertform').style.display = 'none';
                    activeAlarmsDiv.style.display = 'none'; // Hide active alarms section

                    // Show paramedic selection
                    document.getElementById('userSelection').style.display = 'block';
                    fetchUsers(); // Fetch users for paramedic selection
                });

                activeAlarmsDiv.appendChild(alertBox); // Add alert box to the container
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

// Fetch user list with POST request including the password
async function fetchUsers() {
    try {
        const users = await fetchApi(`${apiUrl}/api/users`, 'POST', { password: 'Baum' });
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

// Handle Weiter button below the form
document.getElementById('formWeiterButton').addEventListener('click', () => {
    const room = document.getElementById('room').value;
    const description = document.getElementById('description').value;

    console.log(`Form Data: Room = ${room}, Description = ${description}`);

    // Hide the form and active alarms
    document.getElementById('alertform').style.display = 'none';
    document.getElementById('activeAlarms').style.display = 'none'; // Hide active alarms section

    // Show paramedic selection
    document.getElementById('userSelection').style.display = 'block';
    fetchUsers(); // Fetch users for paramedic selection
});

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
    const sendAlertButton = document.getElementById('sendAlertButton');

    // Fetch active alerts when the page loads
    fetchActiveAlerts();

    sendAlertButton.addEventListener('click', sendAlert);
});
