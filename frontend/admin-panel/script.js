const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

let storedPassword; // the password which was provided by the user upon login
let userData;


document.addEventListener("DOMContentLoaded", function () {
    modalContent.innerHTML = `
        <p>Gib das Passwort ein, um das Admin panel aufzurufen:</p>
        <p id="errorMessage"><!--error messages gets inserted here--></p>
        <div class="input-group" id="passwordInputDiv">
            <input required type="password" id="passwordInput" placeholder>
                <label class="user-label" id="passwordInputLable">Passwort eingeben</label>
        </div>
        <button id="submitPasswordButton" class="button" style="margin-top: 0.5em">Bestätigen</button>
    `;
    document.getElementById("submitPasswordButton").addEventListener('click', submitPassword);
    document.getElementById("passwordInput").addEventListener('keydown', function (event) {
        if (event.key === 'Enter') submitPassword();
    });
});

function submitPassword() {
    const enteredPassword = document.getElementById("passwordInput").value;

    if (!enteredPassword) {
        constructInnerHtmlForErrorMessage(document.getElementById("errorMessage"), "Kein Password eingegeben.",null);
        return;
    }

    fetch(dutyGroupsApiUrl + "?password=" + enteredPassword, {method: 'GET',})
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 403) {
                constructInnerHtmlForErrorMessage(document.getElementById("errorMessage"), "Falsches Passwort.", "Falls du dir sicher bist das richtige password eingegeben zu haben, ");
                fetch(`${livetickerApiUrl}?message=WARNING:+Wrong+password+detected+at+Admin+panel:%0AUsed+password:+${encodeURIComponent(enteredPassword)}`);
            } else {
                throw new Error('Unexpected response status: ' + response.status);
            }
        })
        .then(data => {
            if (data) {
                storedPassword = enteredPassword;
                fetch(`${livetickerApiUrl}?message=Successful+login+at+Admin+panel.`);
                modal.style.display = 'none';
                displayContent();
            }
        })
        .catch(error => {
            constructInnerHtmlForErrorMessage(document.getElementById("errorMessage"), "Ein Fehler ist aufgetreten. Bitte versuche es noch einmal. Fehler: " + error, "Wenn der Fehler weiterhin bestehen bleibt, ");
        });
}

function displayContent () {
    updateUserData();
    displayAlertingMessage();
    displayInventoryItems();
    displayDutyGroups();
    displayUsers();
    displayDangerZone();
}

function updateUserData() {
    userData = fetch(usersApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: storedPassword })
    })
        .then(response => response.json())
        .catch(error => {displayError("Es gab einen Fehler beim laden der Benutzer.", "Error fetching users: " + error, true);});
}

function displayAlertingMessage() {
    const messageDetails = document.getElementById('messageDetails');

    fetch(messageApiUrl)
        .then(response => response.json())
        .then(data => {
            const {stage, content} = data;
            if (stage === 0) {
                messageDetails.innerHTML = `
                    <p>Es ist im Moment keine Nachricht gesetzt</p>
                    <div class="box detailsBox">
                        <p class="description">
                            Neue Nachricht:
                            <select id="stageSelect">
                                <option value="1">Stufe 1 (Info)</option>
                                <option value="2">Stufe 2 (Warnung)</option>
                                <option value="3">Stufe 3 (Sperre)</option>
                            </select>
                        </p>
                        <p id="messagePrefix">Hinweis: </p>
                        <div class="input-group">
                            <input required type="text" name="text" autocomplete="off" id="newAlertingMessageContent" placeholder>
                            <label class="user-label">Nachricht</label>
                        </div>
                        <button id="setNewAlertingMessageButton" class="button elementUnderInput">Neue Nachricht setzen</button>
                    </div>
                `;

                document.getElementById("stageSelect").addEventListener("change", (event) => {
                    const messagePrefix = document.getElementById("messagePrefix");
                    switch (event.target.value) {
                        case "1":
                            messagePrefix.innerText = "Hinweis: ";
                            break
                        case "2":
                            messagePrefix.innerText = "WARNUNG: ";
                            break
                        case "3":
                            messagePrefix.innerText = "Im Moment kann kein Alarm versendet werden: ";
                            break
                    }
                })
                document.getElementById('setNewAlertingMessageButton').addEventListener('click', async function () {
                    const newMessage = document.getElementById('newAlertingMessageContent').value;
                    if (!newMessage) {
                        displayNotification("Es wurde <b>keine</b> neue Alarmierungsnachricht eingegeben.");
                    } else if (await displayConfirmation("Möchtest du wirklich die neue Nachricht: <b>" + document.getElementById("messagePrefix").innerText + " " + newMessage + "</b> setzen?")) {
                        updateAlertingMessage(newMessage, parseInt(document.getElementById("stageSelect").value));
                        fetch(`${livetickerApiUrl}?message=New+Alerting+Message+set:%0AMessage:+${encodeURIComponent(newMessage)}%0AStage:+${encodeURIComponent(["", "1 (Info)", "2 (Warnung)", "3 (Sperre)"][parseInt(document.getElementById("stageSelect").value)])}`)
                    }
                });
            } else {
                messageDetails.innerHTML = `<p><b>Momentane Nachricht:</b> ${content}</p>`;
                const stageText = ["", "1 (Info)", "2 (Warnung)", "3 (Sperre)"][stage];
                messageDetails.innerHTML += `
                    <p><b>Stufe:</b> ${stageText}</p>
                    <button id="clearMessageButton" class="button">Clear Message</button>
                `;

                document.getElementById('clearMessageButton').addEventListener('click', async function () {
                    if (await displayConfirmation("Alarmierungsnachricht <b>löschen</b>?")) {
                        updateAlertingMessage("", 0);
                        fetch(`${livetickerApiUrl}?message=Alerting+Message+cleared:%0AStage:+${encodeURIComponent(stageText)}`)
                    }
                });
            }
            document.getElementById("messageBox").style.display = "block";
        })
        .catch(e => {displayError("Die Alarmierungsnachricht konnte nicht geladen werden", "Failed to load alerting message:" + e, true)});
}

function updateAlertingMessage(newContent, stage) {
    const requestBody = {
        password: storedPassword,
        content: newContent,
        stage: stage
    };

    fetch(messageApiUrl, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)})
        .then(response => {
            if (response.ok) {
                displayNotification("Die Nachricht wurde <b>erfolgreich</b> aktualisiert.");
                displayAlertingMessage();
            }
        })
        .catch(error => {displayError("Die nachricht konnte nicht aktualisiert werden.", "Error posting new message. " + error, true);});
}

function displayInventoryItems() {
    fetch(`${InventoryTrackingAPiUrl}?password=${storedPassword}`)
        .then(response => response.json())
        .then(data => {
            const sortedItems = data.sort((a, b) => {
                const extractParts = (name) => {
                    const match = name.match(/(\D*)(\d*)/); // Separate text and number parts
                    return {
                        text: match[1] ? match[1].trim() : "", // Text portion
                        number: match[2] ? parseInt(match[2], 10) : null // Numeric portion, or null if no number
                    };
                };

                const aParts = extractParts(a.name);
                const bParts = extractParts(b.name);
                const textComparison = aParts.text.localeCompare(bParts.text);
                
                if (textComparison !== 0) return textComparison; // Sort alphabetically by text portion
                return (aParts.number || 0) - (bParts.number || 0); // If text portions are the same, sort numerically by the number part
            });
            
            const itemContainer = document.getElementById('itemContainer');
            itemContainer.innerHTML = '';
            
            sortedItems.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'display-row';
                itemDiv.innerHTML = `
                    <span>Id: <b>${item.id}</b></span>
                    ${item.name} 
                    <span><b>Status: </b>${item.borrowed ? '<b>Ausgeliehen</b>' : 'Verfügbar'}</span>
                    <span><b>Max. Ausleidauer:</b> ${item.maxLendingDuration}</span>
                    <button id="deleteButton-${item.id}" class="button" style="display: inline-block;">Löschen</button>
                `;
            
                itemDiv.querySelector(`#deleteButton-${item.id}`).addEventListener('click', async function () {
                    if (await displayConfirmation(item.name + " <b>löschen</b>?")) {deleteItem(item.id);}
                });
                itemContainer.appendChild(itemDiv);
            });
        })
        .catch(error => {displayError("Die Inventory-Tracking Items konnten nicht geladen werden", "Error fetching items data: " + error, true);});

    const addMaxLendingDurationToggle = document.getElementById("addMaxLendingDurationToggle")
    addMaxLendingDurationToggle.checked = true;
    addMaxLendingDurationToggle.addEventListener('click', function () {
        if (addMaxLendingDurationToggle.checked) {
            document.getElementById('maxLendingDurationInputBox').style.display = 'block';
        } else {
            document.getElementById('maxLendingDurationInputBox').style.display = 'none';
        }    
    })
    document.getElementById('addItemButton').addEventListener('click', async function () {
        const newItemName = document.getElementById('newItemName').value.trim();
        if (!newItemName) {
            displayNotification("<b>Kein Gegenstands name</b> eingegeben.");
            return;
        }
        const maxLendingDurationInputValue = document.getElementById('maxLendingDurationInput').value === "" ? null : parseInt(document.getElementById('maxLendingDurationInput').value);
        if (addMaxLendingDurationToggle.checked && (!maxLendingDurationInputValue || maxLendingDurationInputValue < 1 || maxLendingDurationInputValue > 365)) {
            displayNotification("Die eingegebene maximale Leihdauer muss zwischen <b>1 und 365</b> liegen.");
            return;
        }
        
        if (await displayConfirmation("Gegenstand hinzufügen?<br><b>Name:</b> " + newItemName + "<br><b>Maximale Leihdauer:</b> " + (maxLendingDurationInputValue ? maxLendingDurationInputValue + " Tage" : "Keine"))) {
            const requestBody = {
                name: newItemName,
                maxLendingDuration: maxLendingDurationInputValue,
                password: storedPassword
            };

            fetch(InventoryTrackingAPiUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(requestBody)
            })
                .then(response => response.json())
                .then(data => {
                    displayNotification(data.name + " wurde <b>erfolgreich</b> hinzugefügt.");
                    fetch(`${livetickerApiUrl}?message=Item+got+added:%0AName:+${data.name}%0AMax+Lending+duration:+${maxLendingDurationInputValue || 'No limit'}`);
                    displayInventoryItems();
                })
                .catch(error => {displayError("Der Gegenstand konnte nicht hinzugefügt werden", "Error adding item: " + error, true);});
        }
    });
    
    document.getElementById("inventoryBox").style.display = 'block';
}
function deleteItem(id) {
    fetch(`${InventoryTrackingAPiUrl}/${id}?password=${storedPassword}`, {method: 'DELETE'})
        .then(response => {
            if (response.ok) {
                displayNotification("Der Gegenstand wurde <b>erfolgreich</b> hinzugefügt.");
                fetch(`${livetickerApiUrl}?message=WARNING:+Item+Deleted%0AItem+ID:+${id}`);
                displayInventoryItems();
            } else displayError("Der Gegenstand konnte nicht gelöscht werden.", "Failed to delete Item: " + response.status, true);
        })
        .catch(error => {displayError("Der Gegenstand konnte nicht gelöscht werden.", "Failed to delete Item: " + error, true);});
}

function displayDutyGroups() {
    fetch(`${dutyGroupsApiUrl}?password=${storedPassword}`)
        .then(response => response.json())
        .then(data => {
            const dutyGroupsContainer = document.getElementById('dutyGroupsContainer');
            dutyGroupsContainer.innerHTML = '';

            data.forEach(group => {
                const groupDiv = document.createElement('div')
                groupDiv.className = 'box displayBox';
                
                groupDiv.innerHTML = `
                    <div class="display-row">
                        <span>Id: <b>${group.id}</b></span>
                        <b>${group.userNames.join(', ')}</b>
                        <span>Letzter Dienst vor <b>${group.daysSinceLastDuty}</b> ${(group.daysSinceLastDuty === 1 ? "Tag" : "Tagen")}</span>
                    </div>
                    <div class="display-row">
                        <span>Startzeit: <strong>${group.dutyStart}</strong></span>
                        <span>Endzeit: <strong>${group.dutyEnd}</strong></span>
                        <span>Endzeit an Freitagen: <strong>${group.fridayDutyEnd || "Standard"}</strong></span>
                    </div>
                    <div class="display-row" id="lastUserDisplayRow"><span>Diensttage: <strong>${group.dutyDays.join(', ')}</strong></span></div>
                `;

                const deleteButton = document.createElement('button');
                deleteButton.className = 'button';
                deleteButton.textContent = 'Löschen';
                deleteButton.addEventListener('click', async function () {
                    if (await displayConfirmation("Gruppe " + group.id + " löschen?")) {
                        fetch(`${dutyGroupsApiUrl}/${group.id}?password=${storedPassword}`, {method: 'DELETE'})
                            .then(response => {
                                if (response.status === 204) {
                                    displayNotification("Die Benutzergruppe <b>" + group.id + "</b> wurde <b>erfolgreich gelöscht</b>.");
                                    updateUserData()
                                    displayDutyGroups();
                                } else {displayError("Benutzergruppe konnte nicht gelöscht werden", "Failed to delete duty group. response status: " + response.status, true);}
                            })
                            .catch(error => {displayError("Benutzergruppe konnte nicht gelöscht werden", "Failed to delete duty group: " + error, true);});
                        fetch(`${livetickerApiUrl}?message=WARNING:+Duty+Group+deleted%0AGroup+ID:+${group.id}`);
                    }
                });
                
                groupDiv.querySelector('#lastUserDisplayRow').appendChild(deleteButton);
                dutyGroupsContainer.appendChild(groupDiv);
            });
        })
        .catch(error => {displayError("Die Dienstgruppen konnten nicht geladen werden.", "Error loading duty groups: " + error, true);});


    const addFridayEndTimeToggleDiv = document.getElementById("addFridayEndTimeToggleDiv")
    const addFridayEndTimeToggle = document.getElementById("addFridayEndTimeToggle")
    const fridayDutyEndTimeSpan = document.getElementById('fridayDutyEndTimeSpan')
    document.getElementById("mondayDutyCheckmark").checked = true;
    document.getElementById("tuesdayDutyCheckmark").checked = true;
    document.getElementById("wednesdayDutyCheckmark").checked = true;
    document.getElementById("thursdayDutyCheckmark").checked = true;
    const fridayDutyCheckmark = document.getElementById("fridayDutyCheckmark");
    fridayDutyCheckmark.checked = true;
    fridayDutyCheckmark.addEventListener('click', function (){
        if (event.target.checked) {
            addFridayEndTimeToggleDiv.style.display = 'block';
            addFridayEndTimeToggle.checked = true;
            fridayDutyEndTimeSpan.style.display = 'inline-block';
                        
        } else {
            addFridayEndTimeToggleDiv.style.display = 'none';
            addFridayEndTimeToggle.checked = false;
            fridayDutyEndTimeSpan.style.display = 'none';
        }
    });
    
    addFridayEndTimeToggle.checked = true;
    addFridayEndTimeToggle.addEventListener('click', function () {
        if (event.target.checked) {fridayDutyEndTimeSpan.style.display = 'inline-block';
        } else fridayDutyEndTimeSpan.style.display = 'none';
    });

    const userSelect = document.getElementById('userSelect');
    userSelect.innerHTML = '';
    userData.then(users => {
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.text = user.username;
            userSelect.appendChild(option);
        });
    });
    
    document.getElementById('addDutyGroupButton').addEventListener('click', async function () {
        const selectedUsers = Array.from(document.getElementById('userSelect').selectedOptions)
            .map(option => option.value);
        const selectedDays = Array.from(document.querySelectorAll('#dutyDayContainer label input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        const dutyStart = document.getElementById('dutyStartTime').value;
        const dutyEnd = document.getElementById('dutyEndTime').value;
        const addFridayEndTime = document.getElementById('addFridayEndTimeToggle').checked;
        const fridayDutyEnd = document.getElementById('fridayDutyEndTime').value;

        if (selectedDays.length === 0) {
            displayNotification("Es wurde <b>kein</b> Diensttag ausgewählt.");
            return;
        } else if (!dutyStart || !dutyEnd || (addFridayEndTime && !fridayDutyEnd)) {
            displayNotification("Es wurden <b>nicht alle</b> Zeiten angegeben.")
            return;
        } else if (selectedUsers.length === 0) {
            displayNotification("Es wurde <b>kein</b> Benutzer ausgewählt.");
            return;
        }

        if (!await displayConfirmation("Dienstgruppe hinzufügen?<br><b>Benutzer:</b> " + selectedUsers.join(', ') + "<br><b>Diensttage:</b> " + selectedDays.join(', ') + "<br><b>Startzeit:</b> " + dutyStart + "<br><b>Endzeit:</b> " + dutyEnd + (addFridayEndTime ? "<br><b>Freitag Endzeit:</b> " + fridayDutyEnd : ""))) return;

        const requestBody = {
            userNames: selectedUsers,
            daysSinceLastDuty: 0,
            dutyDays: selectedDays,
            dutyStart,
            dutyEnd,
            fridayDutyEnd,
            password: storedPassword
        };

        fetch(dutyGroupsApiUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())
            .then(data => {
                fetch(`${livetickerApiUrl}?message=Duty+Group+added:%0AUsers:+${selectedUsers.join(', ')}%0ADut+Days:+${selectedDays.join(', ')}%0AStart+time:+${dutyStart}%0AEnd+time:+${dutyEnd}${(addFridayEndTime) ? `%0AEnd+time+if+friday:+${fridayDutyEnd}` : ""}`)
                displayNotification("Die Dienstgruppe wurde <b>erfolgreich</b> hinzugefügt.");
                updateUserData()
                displayDutyGroups();
            })
            .catch(error => {displayError("Es gab einen Fehler beim hinzufügen der Dienstgruppe.", "Error adding duty group: " + error, true);});
    });
    
    document.getElementById("dutyGroupsBox").style.display = "block";
}

function displayUsers() {
    const experienceLevels = ['freshman', 'advanced', 'super-mega-hyper-boss'];
    const userContainer = document.getElementById("userContainer");
    userContainer.innerHTML = ``;

    userData.then(users => {
        users.forEach(user => {
            const userRow = document.createElement('div');
            userRow.className = 'box displayBox';
            
            userRow.innerHTML = `
                <div class="display-row">
                    <b>${user.username}</b>
                    <span class="experienceLevelDiv">Ehrfahrungsniveau: </span>
                </div>
                <div class="display-row ">
                    <span>${(user.telephoneNumber === "none") ? "Kein Signal-Benutzername angegeben" : "Signal-Benutzername: <b>" + user.telephoneNumber + "</b>"}</span>
                    <span class="user-signalUsernameControls"><!-- newUsernameInput or username control buttons get inserted here --></span>
                </div>
            `
            
            const experienceSelect = document.createElement('select');
            experienceLevels.forEach(experienceLevel => {
                const option = document.createElement('option');
                option.value = experienceLevel;
                option.text = experienceLevel;
                if (user.experience === experienceLevel) option.selected = true;
                experienceSelect.appendChild(option);
            });
            userRow.querySelector(".experienceLevelDiv").appendChild(experienceSelect);
            experienceSelect.addEventListener('change', async function () {
                const newExperienceLevel = experienceSelect.value;
                if (await displayConfirmation("Erfahrungslevel von <b>" + user.username + "</b> endern?<br>Altes Erfahrunsglevel: " + user.experience + "<br>Neues Erfahrungslevel: <b> " + newExperienceLevel + "</b>")) {
                    fetch(`${livetickerApiUrl}?message=Experience+level+changed:%0AUser:+${user.username}%0AFrom:+${user.experience}%0ATo:+${newExperienceLevel}`)
                    
                    const requestBody = {
                        experience: newExperienceLevel,
                        password: storedPassword
                    };
                    fetch(`${usersApiUrl}/${user.username}/experience`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(requestBody)
                    })
                        .then(response => {
                            if (response.ok) { displayNotification("Das Erfahrungslevel wurde <b>erfolgreich</b> aktualisiert.");}
                            else displayError("Das Erfahrungslevel konnte nicht aktualisiert werden.", "Failed to update experience level. response status: " + response.status, true);
                        })
                        .catch(error => {displayError("Das Erfahrungslevel konnte nicht aktualisiert werden.", "Failed to update experience level: " + error, true);});
                    
                    updateUserData()
                    displayUsers()
                } else experienceSelect.value = user.experience;
            });

            const userSignalNameControls = userRow.querySelector(".user-signalUsernameControls")
            if (user.telephoneNumber === "none") {
                userSignalNameControls.innerHTML = `
                    <div class="input-group">
                        <input required type="text" name="text" autocomplete="off" class="newSignalUsernameInput" placeholder>
                        <label class="user-label">Neuer Signal-Benutzername</label>
                    </div>
                    <button class="button elementUnderInput addNewSignalUsernameButton">Signal-Benutzernamen hinzufügen</button>
                `
                
                userSignalNameControls.querySelector(".addNewSignalUsernameButton").addEventListener('click', async function () {
                    const newSignalUsername = userSignalNameControls.querySelector(".newSignalUsernameInput").value;
                    
                    if (!newSignalUsername) {
                        displayNotification("Kein neuer Signal-Benutzername eingegeben.");
                        return;
                    }
                    
                    if (await displayConfirmation("Signal-Benutzername für <b> " + user.username + "</b> hinzufügen und <b>Verifikatrionsnachricht senden</b>?<br>Neuer Signal-Benutzername: <b>" + newSignalUsername + "</b>")) {
                        fetch(`${livetickerApiUrl}?message=Signal-Username+added:%0AUser:+${user.username}%0ASignal-Username:+${newSignalUsername}`)
                        sendVerificationMessage(user.username, newSignalUsername);
                        updateSignalUsername(user.username, newSignalUsername);
                        updateUserData()
                        displayDutyGroups()
                    }
                });

            } else {
                userSignalNameControls.innerHTML = `
                <button class="button deleteSignalUsernameButton">Signal-Benutzername löschen</button>
                <button class="button resendVerificationMessageButton elementUnderInput">Verifikationsnachricht erneut senden</button>
                `;

                userSignalNameControls.querySelector(".deleteSignalUsernameButton").addEventListener('click', async function () {
                    if (await displayConfirmation("Signal-Benutzername für <b>" + user.username + "</b> löschen?")) {
                        fetch(`${livetickerApiUrl}?message=Signal-Username+deleted:%0AUser:+${user.username}`)
                        updateSignalUsername(user.username, 'none');
                        updateUserData()
                        displayDutyGroups()
                    }
                });
                userSignalNameControls.querySelector(".resendVerificationMessageButton").addEventListener('click', async function () {
                    if (await displayConfirmation("Verrifikationsnachricht für <b>" + user.username + "</b> erneut senden?")) {
                        sendVerificationMessage(user.username, user.telephoneNumber);
                        fetch(`${livetickerApiUrl}?message=Verification+message+send:%0AUser:+${user.username}`)
                    }
                });
            }
            userContainer.appendChild(userRow);
        });
    });

    document.getElementById("userBox").style.display = "block";
}
function updateSignalUsername(username, newSignalUsername) {
    const requestBody = {
        telephoneNumber: newSignalUsername,
        password: storedPassword
    };

    fetch(`${usersApiUrl}/${username}/telephoneNumber`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody)
    })
        .then(response => {
            if (response.ok) {
                displayNotification("Der Benutzername wurde <b>erfolgreich</b> aktualisiert.");
                updateUserData();
                displayUsers();
            } else displayError("Der Benutzername konnte nicht aktualisiert werden.", "Failed to update Signal-Username. response status: " + response.status, true);
        })
        .catch(error => {displayError("Der Benutzername konnte nicht aktualisiert werden.", "Failed to update Signal-Username: " + error, true);});
}
function sendVerificationMessage(username, signalUsername) {
    let usernameWithoutSpaces = username.replaceAll(" ", "");
    const requestBody = {
        telephoneNumber: signalUsername,
        message: `Hallo ${username}, ich bin SSD-Bot element-i – ein Bot, den Justus programmiert hat, um Aufgaben im Bereich Signal zu automatisieren.\nBitte nimm, falls du dies noch nicht getan hast, die Unterhaltungsanfrage an, damit ich dich in Zukunft mit Nachrichten, die den Schulsanitätsdienst betreffen, erreichen kann.\n\nIch werde dir jeden Tag, an dem du Dienst hast, eine Nachricht senden, um dich daran zu erinnern, ein Gerät mit der SaniAlarm-App bei dir zu tragen.\nDiese Nachricht wird dann auch einen Link enthalten, auf den du klicken kannst, wenn du an diesem Tag nicht in der Schule bist, mit welchem du dich aus dem Dienstplan für diesen Tag austragen kannst.\nIch werde dir außerdem Nachrichten senden, wenn du einer Patientin einen Gegenstand ausgeliehen hast und dieser nicht innerhalb eines bestimmten Zeitraums zurückgebracht wurde.\n\nWenn du diese Nachricht empfangen hast, klicke bitte auf den folgenden Link. Wundere dich nicht, wenn dir nur eine schwarze Seite mit kleinem Text angezeigt wird, dies ist gewollt.\nhttps://saai.wayshare.de:9090/api/signalmessage/liveticker?message=User${usernameWithoutSpaces}confirmedTheConfirmationMessage\n\nWenn es Probleme gibt, verwende entweder die folgende Seite um das Problem zu melden, oder geh in der Schule zu Justus oder Jannik, sie werden dir hoffentlich helfen können.\nhttps://saai.wayshare.de/issue-report\n\nAh, und noch eine letzte Sache: Bitte schreib diesem Signal-Account keine Nachrichten, da sie nicht verarbeitet werden und so nur den Bot verlangsamen.`,
        password: storedPassword
    };
    fetch(signalmessageApiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody)
    })
        .then(response => {
            if (response.ok) {
                displayNotification("Die Verifikationsnachricht wurde <b>erfolgreich</b> an " + username + " gesendet");
                fetch (`${livetickerApiUrl}?message=Verification+message+send:%0AUser:+${username}%0ASignal-Username:+${signalUsername}`);
            } else displayError("Die Verrifikationsnachricht konnte nicht gesendet werden.", "Failed to send verification message. response status: " + response.status, true);
        })
        .catch(error => {displayError("Die Verifikationsnachricht konnte nicht gesendet werden.", "Failed to send verification message: " + error, true)});
}


function displayDangerZone() {
    document.getElementById('notifyDutyUsersButton').addEventListener('click', async function () {
        if (!await displayConfirmation("Benutzer über den heutigen Dienstplan Informieren?")) return;
        if (!await displayConfirmation("Die Benutzer werden <b>jeden Tag automatisch</b> per Signal über den heutigen Dienstplan informiert<br><br><b>Trotzdem</b> Benutzer <b>erneut</b> über den heutigen Dienstplan per signal Informieren?")) return;

        fetch(notifyDutyUsersApiUrl, {method: 'GET'})
            .then(response => {
                if (response.ok) {displayNotification("Die Benutzer wurden <b>erfolgreich</b> über den heutigen Dienstplan informiert.");
            } else displayError("Es gab einen Fehler beim informieren der Benutzer über den Heutigen Dienstplan", "Error notifying todays duty users. Responst status not ok: " + response.status, true);
            }).catch(error => {displayError("Es gab einen Fehler beim informieren der Benutzer über den Heutigen Dienstplan", "Error notifying todays duty users: " + error, true)});
    });

    document.getElementById('assignDutyGroupsButton').addEventListener('click', async function () {
        if (!await displayConfirmation("Dienstgruppen zum Dienstplan dieser Woche zuweisen?")) return;
        if (!await displayConfirmation("Die Dienstgruppen werden <b>jede Woche automatisch</b> zu dem dieswöchigen Dienstplan zugewiesen<br><br><b>Trotzdem erneut</b> Zuweisen?")) return;
        
        fetch(generateTimetableForThisWeekApiUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ password: storedPassword })
        })
            .then(response => {
                if (response.ok) {
                    displayNotification("Die Dienstgruppen wurden <b>erfolgreich</b> dem dieswöchigen Dienstplan zugewiesen.");
                    fetch(`${livetickerApiUrl}?message=Duty+groups+got+manually+assigned+to+timetable.`);
                } else displayError("Es gab einen Fehler beim Zuweisen der Dienstgruppen", "Error assigning duty groups to timetable. Response status not ok: " + response.status, true);
            }).catch(error => {displayError("Es gab einen Fehler beim Zuweisen der Dienstgruppen", "Error assigning duty groups to timetable: " + error, true)});
    });

    document.getElementById('deleteTimetablesButton').addEventListener('click', async function () {
        if (!await displayConfirmation("Alle Dienstplan einträge löschen?")) return;
        if (!await displayConfirmation("Es werden alle Dienstplan Einträge gelöscht. <b>Nicht nur die von dieser Woche!</b> Es gibt auch <b>keine Möglichkeit, dies rückgängig zu machen</b><br><br><b>Trotzdem</b> alle Einträge löschen?")) return;

        fetch(deleteAllTimetablesApiUrl, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({password: storedPassword})
        })
            .then(response => {
                if (response.ok) {
                    displayNotification("Es wurden <b>erfolgreich</b> alle Dienstplan Einträge gelöscht.");
                    fetch (`${livetickerApiUrl}?message=All+Timetables+got+deleted.`);
                } else displayError("Es gab einen Fehler beim löschen der Dienstplan Einträge", "Error deleting timetables. Response status not ok: " + response.status, true);
            }).catch(error => {displayError("Es gab einen Fehler beim löschen der Dienstplan Einträge", "Error deleting timetables: " + error, true)});
    });
}
