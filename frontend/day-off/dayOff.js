const url = 'https://saai.wayshare.de:9090'; // Schulausweichserver IP

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    const verificationNumber = urlParams.get('verificationNumber');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const timetableContainer = document.getElementById('timetableContainer');
    const removeUserButton = document.getElementById('removeUserButton');
    const removeUserContainer = document.getElementById('removeUserContainer');

    // Check if username and verification number are present
    if (!username || !verificationNumber) {
        errorMessage.textContent = 'Fehlende Parameter: Username oder Verifizierungsnummer.';
        errorMessage.style.display = 'block';
        return;
    }

    // Display button to remove user from duty plans
    removeUserButton.textContent = `${username} aus den heutigen Dienstplänen entvernen`;
    removeUserContainer.style.display = 'block';
    removeUserButton.addEventListener('click', function () {
        removeUserFromDuty(username, verificationNumber);
    });

    // Fetch the timetable and display it
    fetchTimetable();

    function fetchTimetable() {
        fetch(`${url}/api/infoscreen`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(apiResponse => {
                loadingMessage.style.display = 'none';

                if (apiResponse.events.length > 0) {
                    displayTimetable(apiResponse.events);
                } else {
                    errorMessage.textContent = 'Keine Dienstplan-Einträge für heute verfügbar.';
                    errorMessage.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Es gab ein Problem beim Laden des Dienstplans:', error);
                loadingMessage.style.display = 'none';
                errorMessage.style.display = 'block';
            });
    }

    function displayTimetable(events) {
        timetableContainer.innerHTML = ''; // Clear previous content

        events.forEach(event => {
            const startTime = event.start_time;
            const endTime = event.end_time;
            const responsibleUsers = event.responsible_users;

            const timetableRow = document.createElement('div');
            timetableRow.classList.add('timetable-row');
            timetableRow.innerHTML = `
                <div class="timetable-details">
                    <div><strong>Start:</strong> ${startTime}</div>
                    <div><strong>Ende:</strong> ${endTime}</div>
                </div>
                <div class="responsible-users"><strong>Dienst haben:</strong> ${responsibleUsers.join(', ')}</div>
            `;

            timetableContainer.appendChild(timetableRow);
        });
    }

    function removeUserFromDuty(username, verificationNumber) {
        const data = {
            username: username,
            verificationNumber: verificationNumber,
        };

        fetch(`${url}/api/dayOff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(response => {
                // Check if the response status is 200 OK
                if (response.ok) {
                    // Hide the button and display success message in the timetable
                    removeUserContainer.style.display = 'none';
                    timetableContainer.innerHTML = `
                    <div class="success-message">
                        Du wurdest erfolgreich aus dem heutigen Dienstplan entfernt.
                    </div>
                `;
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=WARNING:_User_${username}_got_removed from today's timetable.`)
                } else {
                    throw new Error('Failed to remove user');
                }
            })
            .catch(error => {
                console.error('Es gab ein Problem beim Streichen des Benutzers:', error);
                alert('Es gab einen Fehler beim Streichen des Benutzers.');
            });
    }

});
