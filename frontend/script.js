const url = 'https://saai.wayshare.de:9090'; // Schulausweichserver IP

document.addEventListener("DOMContentLoaded", function() {
    // Add event listener to the alarm button
    const alarmButton = document.getElementById('alarmButton');
    alarmButton.addEventListener('click', ConfirmationPopup);

    fetchMessage();
});

document.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("alarmButton").click();
    }
});


// Function to fetch and display the message based on the stage
function fetchMessage() {
    fetch(`${url}/api/message`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            let {stage, content} = data;
            const headerTextDiv = document.getElementById('headertextdiv');
            const messageDiv = document.createElement('div');

            // Stage 0: Do not display the message
            if (stage === 0) {
                alertform.style.display = 'block';
            }

            // Stage 1: Display message with "Hinweis"
            if (stage === 1) {
                messageDiv.style.color = '#fdbbd5';
                messageDiv.style.textAlign = 'center';
                messageDiv.textContent = `Hinweis: ${content}`;
                alertform.style.display = 'block';
            }

            // Stage 2: Display message with "WARNUNG" and white border
            if (stage === 2) {
                messageDiv.style.color = '#fdbbd5';
                messageDiv.style.padding = '10px';
                messageDiv.textContent = `WARNUNG: ${content}`;
                alertform.style.display = 'block';
                messageDiv.className = 'warning'
            }

            // Stage 3: Hide the alert form and display message with "Im moment kann kein alarm versendet werden"
            if (stage === 3) {
                const alertForm = document.getElementById('alertform');
                messageDiv.className = 'issue'
                messageDiv.textContent = `Im moment kann kein Alarm versendet werden: ${content}`;
                //document.getElementById('').style.display = 'none'
                alertform.style.display = 'none'
                document.getElementById('loadingMessage').style.display = 'none';
            } else {
                fetchTimetable();
            }

            // Insert the message div under the header
            headerTextDiv.appendChild(messageDiv);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}


// Automatically fill room field from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
const roomInput = document.getElementById('room');
if (roomParam) {
    roomInput.value = roomParam;
    roomInput.classList.add('has-text');
}

function ConfirmationPopup() {
    let room = document.getElementById('room').value;
    let description = document.getElementById('description').value;

    // Validate input fields
    if (!room || !description) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = 'Bitte alle Felder ausfüllen!';
        errorMessage.style.display = 'block';
        return;
    }

    // Format message with line breaks
    let message = `Alarm senden?\nRaum: ${room}\nBeschreibung: ${description}`;

    // Display the modal with the message
    const modal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');
    modalMessage.textContent = message;
    modal.style.display = 'flex';

    // Handle confirmation button click
    const confirmButton = document.getElementById('confirmButton');
    confirmButton.onclick = function() {
        sendAlert();
        modal.style.display = 'none';
    };

    // Handle cancel button click
    const cancelButton = document.getElementById('cancelButton');
    cancelButton.onclick = function() {
        modal.style.display = 'none';
    };

    // Handle close button click
    const closeButton = document.querySelector('.close-button');
    closeButton.onclick = function() {
        modal.style.display = 'none';
    };
}

function sendAlert() {
    const data = {
        room: document.getElementById('room').value,
        description: document.getElementById('description').value,
    };

    const room = document.getElementById('room').value;
    const description = document.getElementById('description').value;

    fetch(`${url}/api/signalmessage/liveticker?message=New_Alert_in_Room:_${encodeURIComponent(room)}_Description:_${encodeURIComponent(description)}`)


    fetch(url + '/api/alerts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(jsonResponse => {
            if (jsonResponse.status === 'Alert sent successfully') {
                // Store alert_id and redirect to alert progress page with query parameter
                const alertId = jsonResponse.alert_id;
                redirect("alert-progress/index.html?alert_id=" + encodeURIComponent(alertId)); // Pass alert_id as URL parameter
            } else {
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.textContent = 'Alert could not be sent successfully. Please try again.';
                errorMessage.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Der Alarm konnte nicht versendet werden. Geh zu Lernhaus 7-10, frag dort nach den Schulsanitätern und gib Bescheid, dass die Seite nicht funktioniert.';
            errorMessage.style.display = 'block';
        });
}

function redirect(page) {
    window.location.href = page;
}

function fetchTimetable() {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const noDutyWarning = document.getElementById('noDutyWarning');
    const alertform = document.getElementById('alertform');
    const timetableContainer = document.getElementById('timetableContainer');
    const timetableSection = document.querySelector('.timetable'); // Selecting the timetable section


    fetch(`${url}/api/signalmessage/liveticker?message=Alerting_Page_opened`)


    fetch(url + '/api/infoscreen')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(apiResponse => {
            loadingMessage.style.display = 'none';
            errorMessage.style.display = 'none';

            // Handle the next_active information
            const nextActiveTime = apiResponse.next_active;
            if (nextActiveTime === 'Now') {
                noDutyWarning.style.display = 'none';
            } else {
                alertform.style.display = 'none';
                    noDutyWarning.style.display = 'block';
                    document.getElementById('nextActiveTime').textContent = 'Im Moment ist niemand im Dienst';
            }

            // Check if there are timetable events
            if (apiResponse.events.length > 0) {
                timetableSection.style.display = 'block'; // Show timetable section
                timetableContainer.innerHTML = ''; // Clear previous content

                // Populate timetable events
                apiResponse.events.forEach(entry => {
                    const startTime = entry.start_time;
                    const endTime = entry.end_time;
                    const responsibleUsers = entry.responsible_users;
                    const isActive = entry.is_active;

                    const timetableRow = document.createElement('div');
                    timetableRow.classList.add('timetable-row');
                    if (isActive) {
                        timetableRow.classList.add('active-timetable');
                    }

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

        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            loadingMessage.style.display = 'none';
            errorMessage.style.display = 'block';
            alertform.style.display = 'none';
            noDutyWarning.style.display = 'none';
            timetableSection.style.display = 'none'; // Hide timetable section on error
        });
}


// Call fetchTimetable when the document is loaded
document.addEventListener("DOMContentLoaded", function() {

    // Add event listeners to input fields to change border color based on input value
    const roomInput = document.getElementById('room');
    const descriptionInput = document.getElementById('description');

    roomInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            this.classList.add('has-text');
        } else {
            this.classList.remove('has-text');
        }
    });

    descriptionInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            this.classList.add('has-text');
        } else {
            this.classList.remove('has-text');
        }
    });
});
