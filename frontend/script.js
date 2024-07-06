const url = 'http://172.105.89.210:9090'; // testserver IP

document.addEventListener("DOMContentLoaded", function() {
    // Add event listener to the alarm button
    const alarmButton = document.getElementById('alarmButton');
    alarmButton.addEventListener('click', ConfirmationPopup);
});

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
    let message = `Alarm versenden?\nRaum: ${room}\nBeschreibung: ${description}`;

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

    fetch(url + '/alerts', {
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
            console.log(jsonResponse); // Log the response for debugging purposes

            if (jsonResponse.status === 'Alert sent successfully') {
                redirect("alert-progress"); // Redirect if alert was sent successfully
            } else {
                // Display message that alert could not be sent
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.textContent = 'Alert could not be sent successfully. Please try again.';
                errorMessage.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            // Display generic error message
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Der Alarm konnte nicht versendet werden, bitte versuche es nochmal, wenn es immer noch nicht klappt, gehe bitte zu Lernhaus 7-10 und frage nach den Schulsanitätern.';
            errorMessage.style.display = 'block';
        });
}

function redirect(page) {
    window.location.href = page;
}

/*function ConfirmationPopup() {
    let room = document.getElementById('room').value;
    let description = document.getElementById('description').value;
    let message = "Alarm versenden?\nRaum: " + room +  "\nBeschreibung: " + description;
    if (confirm(message) == true) {
        sendAlert();
    }
    document.getElementById("demo").innerHTML = text;
}
*/


function fetchTimetable() {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const noDutyWarning = document.getElementById('noDutyWarning');
    const alertform = document.getElementById('alertform');
    const timetableContainer = document.getElementById('timetableContainer');
    const timetableSection = document.querySelector('.timetable'); // Selecting the timetable section

    fetch(url + '/infoscreen')
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
                alertform.style.display = 'block';
                noDutyWarning.style.display = 'none';
            } else {
                alertform.style.display = 'none';
                noDutyWarning.style.display = 'block';
                document.getElementById('nextActiveTime').textContent = nextActiveTime;
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
    fetchTimetable();

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
