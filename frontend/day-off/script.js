const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const verificationNumber = urlParams.get('verificationNumber');

document.addEventListener("DOMContentLoaded", function () {
    const loadingMessage = document.getElementById('loadingMessage');
    if (!username || !verificationNumber) {
        loadingMessage.style.display = 'none';
        displayError("Kein Benutzername oder Verifikationsnummer gefunden.", "Stelle sicher, das du die website nur über den link der dir per signal HEUTE zugeschickt wurde aufrufst. Wenn das problem trotzdem auftritt, ")
        return;
    }
    
    fetchAndDisplayTimetable(document.getElementById("timetableDiv"), false).then(() => {
        loadingMessage.style.display = 'none';
        document.getElementById('removeUserDiv').style.display = 'block';

        const removeUserButton = document.getElementById('removeUserButton');
        removeUserButton.textContent = `${username} aus dem heutigen Dienstplan entfernen`;
        removeUserButton.addEventListener('click', function () {
            
            modalContent.innerHTML = `
                <p>Beschreibe gegebenenfalls, warum du dich austragen lässt und ob du an dem heutigen wochentag keinem Dienst mehr zugewiesen werden wirst:</p>
                <div class="input-group">
                    <input required type="text" id="reasonInput" class="input">
                    <label class="user-label">Grund für austragung</label>
                </div>
                <br>
                <div id="buttonDiv" style="display: flex">
                    <button id="returnButton" class="button">Abbrechen</button>
                    <button id="continueButton" style="margin-left: auto" class="button">Austragen</button>
                </div>
            `;
            document.body.classList.add('modal-open');
            modal.style.display = 'flex';

            document.getElementById("returnButton").addEventListener('click', function () {
                document.body.classList.remove('modal-open');
                modal.style.display = 'none';
            });
            
            document.getElementById("continueButton").addEventListener('click', function () {
                document.body.classList.remove('modal-open');
                modal.style.display = 'none';

                const enteredReason = document.getElementById("reasonInput").value;
                removeUserFromDuty(username, verificationNumber, enteredReason);
            });
        });
        
        if (!document.getElementById("timetableDiv").innerHTML.includes(username)) {
            displayError("Du stehst nicht im heutigen Dienstplan.", `Der benutzer: "${username}" steht nicht im heutigen dienstplan. Wenn du glaubst das dies ein fehler ist, `);
        }
    });
});

function removeUserFromDuty(username, verificationNumber,reason) {
    const requestBody = {
        username: username,
        verificationNumber: verificationNumber,
    };
    fetch(dayOffApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    })
        .then(response => {
            if (response.status === 403) {
                displayError("Faltesche Verifikationsnummer.", "Stelle sicher, das du diese seite nur über den link aufrufst den du HEUTE auf signal bekommen hast. Falls du glaubst das dies ein fehler ist, ")
                return;
            }
            if (response.ok) {
                fetch(`${livetickerApiUrl}?message=WARNING:_User_got_removed from today's timetable.%0AUsername:_${username}%0AReason:_${reason}`);
                displayNotification("Du wurdest erfolgreich aus dem heutigen dienstplan ausgetragen")
            } else {
                throw new Error('Failed to remove user');
            }
        })
        .catch(error => {
            displayError("Es gab einen Fehler beim entfernen des benutzers aus dem Dienstplan.", error)
        });
}
