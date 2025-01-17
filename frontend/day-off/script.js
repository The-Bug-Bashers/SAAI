const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const verificationNumber = urlParams.get('verificationNumber');

document.addEventListener("DOMContentLoaded", function () {
    const loadingMessage = document.getElementById('loadingMessage');
    if (!username || !verificationNumber) {
        loadingMessage.style.display = 'none';
        displayError("Kein Benutzername oder Verifikationsnummer gefunden.", "Stelle sicher, dass du die website nur über den Link, der dir per signal HEUTE zugeschickt wurde, aufrufst.<br><br>Wenn das Problem trotzdem auftritt, ")
        return;
    }
    
    fetchAndDisplayTimetable(document.getElementById("timetableDiv"), false).then(() => {
        loadingMessage.style.display = 'none';
        
        document.getElementById('usernameSpan').innerHTML = username;
        document.getElementById('removeUserDiv').style.display = 'block';

        document.getElementById('removeUserButton').addEventListener('click', function () {
            
            modalContent.innerHTML = `
                <p>Beschreibe gegebenenfalls, wieso du dich austrägst und informiere uns darüber, falls dir am heutigen Wochentag kein Dienst mehr zugewiesen werden soll:</p>
                <div class="input-group">
                    <input required type="text" id="reasonInput" class="input">
                    <label class="user-label">Begründung</label>
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
            displayError("Du stehst nicht im heutigen Dienstplan.", `Der benutzer: "${username}" steht nicht im heutigen dienstplan.<br><br>Wenn du glaubst, das dies ein fehler ist, `);
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
                displayError("Falsche Verifikationsnummer.", "Stelle sicher, dass du diese Seite über den Link aufgerufen hast, den du HEUTE auf Signal erhalten hast. <br><br>Falls du glaubst, dass dies ein Fehler ist, ")
                return;
            }
            if (response.ok) {
                fetch(`${livetickerApiUrl}?message=User+got+removed+from+today's+timetable:%0AUsername:+${username}%0AReason:+${reason}`)
                    .then(() => {
                        const newMessage = encodeURIComponent("");
                        window.location.replace(`../timetable/?message=Du+wurdest+erfolgreich+aus+dem+heutigen+Dienstplan+ausgetragen.`);
                    });
            } else {
                throw new Error('Failed to remove user');
            }
        })
        .catch(error => {
            displayError("Es gab einen Fehler beim entfernen des benutzers aus dem Dienstplan.", error)
        });
}
