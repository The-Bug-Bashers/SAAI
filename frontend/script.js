document.addEventListener("DOMContentLoaded", function() {
    fetch(`${livetickerApiUrl}?message=Alerting+Page+opened`);
    
    document.getElementById('alarmButton').addEventListener('click', function () {
        const description = document.getElementById('description');
        const room = document.getElementById('room');
        const alertingErrorMessage = document.getElementById('alertingErrorMessage');
        if (!description.value) {
            alertingErrorMessage.textContent = 'Bitte Beschreibung der Verletzung eingeben!'
            alertingErrorMessage.style.display = 'block';
        } else if (!room.value) {
            alertingErrorMessage.textContent = 'Bitte Beschreibung des Ortes eingeben!'
            alertingErrorMessage.style.display = 'block';
        } else {
            const roomDetails = constructRoomInfo();
            modalContent.innerHTML = `
                <h2>Alarm senden?</h2><b>Beschreibung: </b><span>${description.value}</span><br><b>Raum: </b><span>${roomDetails}</span>
                <br>
                <div id="buttonDiv" style="display: flex" style="margin-top: 0.5em">
                    <button id="returnButton" class="button">Abbrechen</button>
                    <button id="continueButton" style="margin-left: auto" class="button">Alarm senden</button>
                </div>
            `;
            document.body.classList.add('modal-open');
            modal.style.display = 'flex';
            
            const confirmButton = document.getElementById('continueButton');
            confirmButton.onclick = function() {
                sendAlert();
                document.body.classList.remove('modal-open');
                modal.style.display = 'none';
            };
            
            const cancelButton = document.getElementById('returnButton');
            cancelButton.onclick = function() {
                document.body.classList.remove('modal-open');
                modal.style.display = 'none';
            };
        }
    });
    
    fetchMessage();
    
    fetchAndDisplayTimetable(document.getElementById("timetableDiv"), false)
        .then(response => {
            document.getElementById('loadingMessage').style.display = 'none';

            if (response.next_active !== 'Now') {
                document.getElementById("alertForm").style.display = 'none';
                document.getElementById("warningDisplayDiv").style.display = 'block';
            }
        })
        .catch(error => {
            displayError("Es gab ein problem beim laden des Dienstplans", `${error}<br><br>`, true)
        });
});

document.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("alarmButton").click();
    }
});


function fetchMessage() {
    fetch(messageApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(response => {
            let {stage, content} = response;
            const warningDisplayDiv = document.getElementById('warningDisplayDiv');
            const alertForm = document.getElementById('alertForm');
            
            switch(stage) {
                case 0:
                    alertForm.style.display = 'block';
                    fillFormFromUrl();   
                    break;
                case 1:
                    warningDisplayDiv.style.padding = '10px';
                    warningDisplayDiv.textContent = `Hinweis: ${content}`;
                    warningDisplayDiv.style.display = 'block';
                    alertForm.style.display = 'block';
                    fillFormFromUrl();
                    break;
                case 2:
                    warningDisplayDiv.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--font-color');
                    warningDisplayDiv.innerHTML = `<b>WARNUNG: </b>${content}`;
                    warningDisplayDiv.style.display = 'block';
                    alertForm.style.display = 'block';
                    fillFormFromUrl();
                    break;
                case 3:
                    warningDisplayDiv.style.borderColor = 'red';
                    warningDisplayDiv.innerHTML = `<b>Im Moment kann kein Alarm versendet werden: </b>${content}`;
                    warningDisplayDiv.style.display = 'block';
                    break;
                default:
                    displayError("Ungültiger nachricht status", `The message stage "${stage}" is not valid`, true)
            }
            
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function fillFormFromUrl() {
    const roomParam = new URLSearchParams(window.location.search).get('room');

    if (roomParam) {
        const roomNumber = roomParam.match(/\(([^)]+)\)/);
        if (roomNumber) {
            document.getElementById('roomNumber').value = roomNumber[1];
        }
        document.getElementById('room').value = roomParam.replace(/ \([^)]*\)/, '');
    }
}

function constructRoomInfo() {
    if (document.getElementById('roomNumber').value) {
        return(document.getElementById('room').value + ' (' + document.getElementById('roomNumber').value + ')');
    } else {
        return(document.getElementById('room').value);
    }
}

function sendAlert() {
    const alertDetails = {
        room: constructRoomInfo(),
        description: document.getElementById('description').value,
    };

    fetch(livetickerApiUrl + "?message=New+alert+sent:%0ARoom:+" + encodeURIComponent(alertDetails.room) + "%0ADescription:+" + encodeURIComponent(alertDetails.description))

    fetch(alertApiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify(alertDetails),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(jsonResponse => {
            if (jsonResponse.status === 'Alert sent successfully') {
                window.location.href = "alert-progress/?alert_id=" + encodeURIComponent(jsonResponse.alert_id);
            } else {
                fetch(livetickerApiUrl + "?message=CRITICAL+WARNING!:+Alert+NOT+send+successful!%0ARoom:+" + encodeURIComponent(alertDetails.room) + "%0ADescription:+" + encodeURIComponent(alertDetails.description) + "%0AResponseStatus:+" + encodeURIComponent(jsonResponse.status) + "%0AFullResponse:+" + encodeURIComponent(jsonResponse))
                displayError("Der alarm konnte nicht verschickt werden bitte nochmal versuchen", jsonResponse + '<br><br>', false);
            }
        })
        .catch(error => {
            displayError("Ein problem ist aufgetreten, bitte nochmal versuchen.", error + '<br><br>', true);
        });
}
