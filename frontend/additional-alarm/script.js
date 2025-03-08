let roomDetails;
let users;

document.addEventListener("DOMContentLoaded", function () {
    fetch(livetickerApiUrl + "?message=Backup_request_site_opened")

    fetchAndDisplayActiveAlerts();
});

document.getElementById('formWeiterButton').addEventListener('click', () => {
    const alertingErrorMessage = document.getElementById('alertingErrorMessage');
    if (!document.getElementById('description').value) {
        alertingErrorMessage.textContent = 'Bitte Beschreibung der Verletzung eingeben!'
        alertingErrorMessage.style.display = 'block';
    } else if (!document.getElementById('room').value) {
        alertingErrorMessage.textContent = 'Bitte Beschreibung des Ortes eingeben!'
        alertingErrorMessage.style.display = 'block';
    } else {
        if (document.getElementById('roomNumber').value) {
            roomDetails = document.getElementById('room').value + ' (' + document.getElementById('roomNumber').value + ')';
        } else {
            roomDetails = document.getElementById('room').value;
        }
        switchToParamedicSelection()
    }
});



function fetchAndDisplayActiveAlerts() {
    const activeAlarmsDiv = document.getElementById('activeAlarms');

    fetch(activeAlertsApiUrl)
        .then(response => {
            if (!response.ok) throw new Error("Response was not ok: " + response.statusText);
            document.getElementById('activeAlarmsLoadingMessage').style.display = 'none';
            fetchUsers() // Fetch users in parallel to prevent long loading times
            return response.json();
        })
        .then(activeAlerts => {
            if (activeAlerts.length === 0) {
                activeAlarmsDiv.innerHTML = '<h3>Keine aktiven Alarme.</h3>';
                return;
            }
            
            activeAlerts.forEach(alert => {
                const alertBox = document.createElement('div');
                alertBox.classList.add('activeAlert-row');

                alertBox.innerHTML = `
                    <div class="activeAlert-details">
                        <div><strong>Beschreibung:</strong> ${alert.description}</div>
                        <div><strong>Raum:</strong> ${alert.room}</div>
                    </div>
                    <button type="button" id="continueWithActiveAlertButton" class="button">Weiter</button>
                `;
                alertBox.querySelector('#continueWithActiveAlertButton').addEventListener('click', () => {
                    document.getElementById('description').value = alert.description;
                    roomDetails = alert.room;
                    
                    switchToParamedicSelection()
                });

                activeAlarmsDiv.appendChild(alertBox);
            });
        })
        .catch( error => {
            console.log(error);
            displayError("Fehler beim Laden der aktiven Alarme", "could not load active alerts", true);
        });
}

function switchToParamedicSelection() {
    document.getElementById('alertForm').style.display = 'none';
    document.getElementById('processExplanation').style.display = 'none';
    document.getElementById("activeAlarmsBox").style.display = 'none';
    document.getElementById('userSelectionBox').style.display = 'block';
    insertUsers()
}

function fetchUsers() {
    fetch(usersApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'Baum' })
    })
        .then(response => {
            if (!response.ok) throw new Error("Response was not ok: " + response.statusText);
            return response.json();
        })
        .then(returnedUsers => {
            users = returnedUsers;
        })
        .catch( error => {
            console.log(error);
            displayError("Fehler beim Laden der aktiven Benutzer", error, true);
        });
}

function insertUsers() {
    const categories = {freshman: [], advanced: [], super: []};
    users.forEach(user => {
        if (user.experience === 'freshman') categories.freshman.push(user);
        else if (user.experience === 'advanced') categories.advanced.push(user);
        else if (user.experience === 'super-mega-hyper-boss') categories.super.push(user);
        else displayError("Benutzer mit unbekanntem Erfahrungslevel gefunden", "unknown experience level: " + user, true);
    });

    const userListDiv = document.getElementById('userList');
    const renderCategory = (title, userArray) => {
        const experienceLevelHeader = document.createElement('h3');
        experienceLevelHeader.textContent = title;
        experienceLevelHeader.classList.add("experienceLevelHeader");
        userListDiv.appendChild(experienceLevelHeader);

        const userBox = document.createElement('div');
        userBox.classList.add('user-box');
        userListDiv.appendChild(userBox);

        userArray.forEach(user => {
            const userElement = document.createElement('div');
            userElement.classList.add('user-row');
            userElement.dataset.uuid = user.uuid;

            userElement.innerHTML = `
                <input type="checkbox" class="userCheckbox" style="display: none" data-uuid="${user.uuid}">
                <strong class="username">${user.username}</strong> <!-- ID is used later to extract username -->
            `;

            userElement.addEventListener('click', function () {
                const checkbox = userElement.querySelector('.userCheckbox');
                checkbox.checked = !checkbox.checked;
                userElement.classList.toggle('user-selected');
            });

            userBox.appendChild(userElement);
        });
    };
    renderCategory('Super-mega-hyper-boss', categories.super);
    renderCategory('Advanced', categories.advanced);
    renderCategory('Freshman', categories.freshman);
}

async function sendAlert() {
    const selectedUsers = Array.from(document.querySelectorAll('.userCheckbox:checked'));
    const alertDetails =({
        room: roomDetails,
        description: writeDescription(document.getElementById('description').value),
        users: selectedUsers.map(user => user.dataset.uuid),
        userNames: selectedUsers.map(userCheckbox =>
            userCheckbox.parentElement.querySelector('.username').textContent
        ),
    });

    fetch(livetickerApiUrl + "?message=Backup_requested%0ARoom:_" + encodeURIComponent(alertDetails.room) + "%0ADescription:_" + encodeURIComponent(alertDetails.description) + "%0ASelected_users:_" + encodeURIComponent(alertDetails.userNames.join(', ')));

    fetch(singleAlertApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertDetails)
    })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(jsonResponse => {
            if (jsonResponse.status && jsonResponse.status.toLowerCase().includes('success')) {
                window.location.href = "../alert-progress/?alert_id=" + encodeURIComponent(jsonResponse.alert_id);
            } else {
                displayError("Der Alarm konnte nicht verarbeitet werden, bitte nochmal versuchen", "Unexpected status: " + jsonResponse.status.toLowerCase(), true);
            }
        })
        .catch(error => {
            displayError("Der Alarm konnte nicht versendet werden, bitte nochmal versuchen", error, true);
        });
}

function writeDescription(enteredDescription) {
    const numberedMatch = enteredDescription.match(/^(\d+)\. Nachalarmierung: (.*)$/);
    if (enteredDescription.startsWith("Nachalarmierung: ")) {
        return "2. " + enteredDescription;
    } else if (numberedMatch) {
        return (parseInt(numberedMatch[1]) + 1) + ". Nachalarmierung: " + numberedMatch[2];
    } else {
        return "Nachalarmierung: " + enteredDescription;
    }
}
