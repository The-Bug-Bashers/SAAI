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
                alertBox.classList.add('timetable-row'); // Active alarm box styling

                alertBox.innerHTML = `
                    <div class="timetable-details">
                        <div><strong>Raum:</strong> ${alert.room}</div>
                        <div><strong>Beschreibung:</strong> ${alert.description}</div>
                    </div>
                    <button type="button" class="weiterButton">Weiter (Alarm)</button>
                `;

                const weiterButton = alertBox.querySelector('.weiterButton');
                weiterButton.addEventListener('click', () => {
                    document.getElementById('room').value = alert.room;
                    document.getElementById('description').value = alert.description;
                    document.getElementById('alertform').style.display = 'none';
                    activeAlarmsDiv.style.display = 'none';
                    document.getElementById('userSelection').style.display = 'block';
                    fetchUsers(); // Fetch users for paramedic selection
                });

                activeAlarmsDiv.appendChild(alertBox);
            });
        } else {
            activeAlarmsDiv.innerHTML = '<p>Keine aktiven Alarme.</p>';
        }

        // Show the form after fetching active alerts
        document.getElementById('alertform').style.display = 'block';
    } catch (error) {
        console.error('Error fetching active alerts:', error);
        document.getElementById('errorMessage').style.display = 'block';
    }
}

// Fetch user list with POST request including the password
async function fetchUsers() {
    try {
        const users = await fetchApi(`${apiUrl}/api/users`, 'POST', { password: 'Baum' });
        const userListDiv = document.getElementById('userList');
        userListDiv.innerHTML = ''; // Clear previous content

        // Separate users by experience level
        const categories = {
            freshman: [],
            advanced: [],
            super: []
        };

        users.forEach(user => {
            if (user.experience === 'freshman') categories.freshman.push(user);
            if (user.experience === 'advanced') categories.advanced.push(user);
            if (user.experience === 'super-mega-hyper-boss') categories.super.push(user);
        });

        // Render users under their respective experience headers inside one box per category
        const renderCategory = (title, userArray, headerClass) => {
            if (userArray.length > 0) {
                const categoryHeader = document.createElement('h3');
                categoryHeader.textContent = title;
                categoryHeader.classList.add(headerClass); // Apply specific class to the header
                userListDiv.appendChild(categoryHeader);

                const userBox = document.createElement('div');
                userBox.classList.add('user-box'); // Box for the users
                userListDiv.appendChild(userBox);

                userArray.forEach(user => {
                    const userElement = document.createElement('div');
                    userElement.classList.add('userRow'); // Simple row for each user inside the box
                    userElement.dataset.uuid = user.uuid;

                    userElement.innerHTML = `
                        <input type="checkbox" style="display:none;" class="userCheckbox" data-uuid="${user.uuid}">
                        <strong>${user.username}</strong>
                    `;

                    userElement.addEventListener('click', function () {
                        const checkbox = userElement.querySelector('.userCheckbox');
                        checkbox.checked = !checkbox.checked; // Toggle checkbox
                        userElement.classList.toggle('selected'); // Toggle visual state for selected users
                    });

                    userBox.appendChild(userElement); // Add user to the user box
                });
            }
        };

        // Render all categories with different header styles
        renderCategory('Super-mega-hyper-boss', categories.super, 'super-header');
        renderCategory('Advanced', categories.advanced, 'advanced-header');
        renderCategory('Freshman', categories.freshman, 'freshman-header');

    } catch (error) {
        console.error('Error fetching users:', error);
        document.getElementById('errorMessage').style.display = 'block';
    }
}

// Handle Weiter button below the form
document.getElementById('formWeiterButton').addEventListener('click', () => {
    const room = document.getElementById('room').value;
    const description = document.getElementById('description').value;
    document.getElementById('alertform').style.display = 'none';
    document.getElementById('activeAlarms').style.display = 'none'; // Hide active alarms section
    document.getElementById('userSelection').style.display = 'block';
    fetchUsers(); // Fetch users for paramedic selection
});

// Send alert with selected users
// Send alert with selected users
async function sendAlert() {
    const selectedUsers = Array.from(document.querySelectorAll('.userCheckbox:checked'))
        .map(checkbox => checkbox.dataset.uuid);

    const room = document.getElementById('room').value;
    const description = document.getElementById('description').value;

    fetch(`${apiUrl}/api/signalmessage/liveticker?message=Backup_requestet_in_Room:_${encodeURIComponent(room)}_Description:_${encodeURIComponent(description)}`)
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

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const jsonResponse = await response.json();

        // Log the response to inspect the actual status structure
        console.log('API Response:', jsonResponse);

        // Check if alert was sent successfully based on the actual response structure
        if (jsonResponse.status && jsonResponse.status.toLowerCase().includes('success')) {
            const alertId = jsonResponse.alert_id;
            redirectToAlertProgress(alertId); // Call redirect function with alert_id
        } else {
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Alert could not be sent successfully. Please try again.';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = 'Der Alarm konnte nicht versendet werden. Geh zu Lernhaus 7-10, frag dort nach den Schulsanitätern und gib Bescheid, dass die Seite nicht funktioniert.';
        errorMessage.style.display = 'block';
    }
}

// Function to handle redirection to alert progress page with correct base URL
function redirectToAlertProgress(alertId) {
    const alertProgressUrl = `https://saai.wayshare.de/alert-progress/index.html?alert_id=${encodeURIComponent(alertId)}`;
    window.location.href = alertProgressUrl;
}


// Initialize the page
document.addEventListener("DOMContentLoaded", function () {
    const sendAlertButton = document.getElementById('sendAlertButton');
    fetchActiveAlerts();
    sendAlertButton.addEventListener('click', sendAlert);
    fetch(`${apiUrl}/api/signalmessage/liveticker?message=Backup_requestet_site_opened`)
});
function redirect(page) {
    window.location.href = page;
}