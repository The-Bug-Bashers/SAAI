const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

let storedPassword; // the password which was provided by the user upon login


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
    displayAlertingMessage();
    displayInventoryItems();
    displayDutyGroups();
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
                groupDiv.className = 'box userRow';
                
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
    fetchUsers().then(users => {
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
                displayDutyGroups();
            })
            .catch(error => {displayError("Es gab einen Fehler beim hinzufügen der Dienstgruppe.", "Error adding duty group: " + error, true);});
    });
    
    document.getElementById("dutyGroupsBox").style.display = "block";
}


// NOT REFACTORED:


function fetchUsers() {
        const requestBody = { password: storedPassword };

        return fetch('https://saai.wayshare.de:9090/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching users:', error);
                alert('There was an error fetching users. Please try again later.');
            });
    }

    

    function displayUsers(data) {
        const userBox = document.getElementById("userBox");
        userBox.classList.add("userBox");
        userBox.innerHTML = `<h1>User Administration</h1><hr class="big-separator">`;

        const usersContainer = document.createElement('section');
        usersContainer.id = 'usersContainer';

        const experienceLevels = ['freshman', 'advanced', 'super-mega-hyper-boss'];

        data.forEach(user => {
            const userRow = document.createElement('div');
            userRow.className = 'user-row';

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'user-details';
            detailsDiv.innerHTML = `<strong>${user.username}</strong><br>`;
            userRow.appendChild(detailsDiv);

            const experienceDiv = document.createElement('div');
            experienceDiv.className = 'user-experience';
            const experienceLabel = document.createElement('span');
            experienceLabel.textContent = 'Experience level: ';
            experienceDiv.appendChild(experienceLabel);

            const experienceSelect = document.createElement('select');
            experienceLevels.forEach(level => {
                const option = document.createElement('option');
                option.value = level;
                option.text = level;
                if (user.experience === level) {
                    option.selected = true;
                }
                experienceSelect.appendChild(option);
            });

            experienceSelect.addEventListener('change', function () {
                const newExperience = experienceSelect.value;
                const confirmation = confirm(`Do you really want to change the experience level for ${user.username} to ${newExperience}?`);
                if (confirmation) {
                    updateExperience(user.username, newExperience);
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Experience_level_changed_for_${user.username}_to_${newExperience}.`)
                } else {
                    experienceSelect.value = user.experience;
                }
            });

            experienceDiv.appendChild(experienceSelect);
            userRow.appendChild(experienceDiv);

            const telephoneDiv = document.createElement('div');
            telephoneDiv.className = 'user-telephone';

            if (user.telephoneNumber === 'none' || !user.telephoneNumber) {
                const telephoneInput = document.createElement('input');
                telephoneInput.type = 'text';
                telephoneInput.placeholder = 'Example.64';
                telephoneInput.className = 'user-experience';

                const setTelephoneButton = document.createElement('button');
                setTelephoneButton.textContent = 'Set Signal-Username';

                setTelephoneButton.addEventListener('click', function () {
                    const newNumber = telephoneInput.value;
                    const confirmation = confirm(`Do you really want to set the Signal-Username to ${newNumber} for ${user.username}?`);
                    if (confirmation) {
                        updateTelephoneNumber(user.username, newNumber);
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Signal-Username_set_to_${newNumber}_for_${user.username}.`)
                    }
                });

                telephoneDiv.appendChild(telephoneInput);
                telephoneDiv.appendChild(setTelephoneButton);
            } else {
                telephoneDiv.innerHTML = `Signal-Username: ${user.telephoneNumber} `;

                const clearTelephoneButton = document.createElement('button');
                clearTelephoneButton.textContent = 'Clear Signal-Username';

                clearTelephoneButton.addEventListener('click', function () {
                    const confirmation = confirm(`Do you really want to clear the Signal-Username for ${user.username}?`);
                    if (confirmation) {
                        updateTelephoneNumber(user.username, 'none');
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Signal-Username_cleared_for_${user.username}.`)
                    }
                });

                telephoneDiv.appendChild(clearTelephoneButton);

                // Add "Send Verification Message" button
                const sendVerificationButton = document.createElement('button');
                sendVerificationButton.textContent = 'Send Verification Message';

                sendVerificationButton.addEventListener('click', function () {
                    const confirmation = confirm(`Do you really want to send a verification message to ${user.telephoneNumber} for ${user.username}?`);
                    if (confirmation) {
                        sendVerificationMessage(user.telephoneNumber, user.username);
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Verification_message_send_to_${user.username}.`)
                    }
                });

                telephoneDiv.appendChild(sendVerificationButton);
            }

            userRow.appendChild(telephoneDiv);
            usersContainer.appendChild(userRow);
        });

        userBox.appendChild(usersContainer);
    }

    function updateExperience(username, newExperience) {
        const requestBody = {
            experience: newExperience,
            password: storedPassword
        };

        fetch(`https://saai.wayshare.de:9090/api/users/${username}/experience`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => {
                if (response.ok) {
                    alert(`Experience level for ${username} updated successfully.`);
                } else {
                    alert(`Failed to update experience for ${username}.`);
                }
            })
            .catch(error => {
                console.error('Error updating experience:', error);
                alert('There was an error updating the experience. Please try again.');
            });
    }

    function updateTelephoneNumber(username, newTelephoneNumber) {
        const requestBody = {
            telephoneNumber: newTelephoneNumber,
            password: storedPassword
        };

        fetch(`https://saai.wayshare.de:9090/api/users/${username}/telephoneNumber`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => {
                if (response.ok) {
                    alert(`Signal-Username for ${username} updated successfully.`);
                    fetchUsers();
                } else {
                    alert(`Failed to update Signal-Username for ${username}.`);
                }
            })
            .catch(error => {
                console.error('Error updating Signal-Username:', error);
                alert('There was an error updating the Signal-Username. Please try again.');
            });
    }

    function sendVerificationMessage(telephoneNumber, username) {
        let usernameWithoutSpaces = username.replace(/\s+/g, '');
        const requestBody = {
            telephoneNumber: telephoneNumber,
            message: `Hallo ${username}, ich bin VaGABfS, ein Bot, den Justus programmiert hat, um Aufgaben im Bereich Signal zu automatisieren.\nBitte nimm die Unterhaltungsanfrage an, damit ich dich in Zukunft mit Nachrichten, die den Schulsanitätsdienst betreffen, erreichen kann.\n\nIch werde dir jeden Tag, an dem du Dienst hast, eine Nachricht senden, um dich daran zu erinnern, ein Gerät mit der SaniAlarm-App bei dir zu tragen.\nDiese Nachricht wird dann auch einen Link enthalten, auf den du klicken kannst, wenn du an diesem Tag nicht in der Schule bist. Dann wirst du automatisch aus dem Dienstplan für diesen Tag entfernt.\n\nWenn du diese Nachricht empfangen hast, klicke bitte auf den folgenden Link. Wundere dich nicht, wenn du nur eine schwarze Seite mit "message": "Signal message sent successfully" siehst, dies ist gewollt und der Link informiert die Administratoren, dass du diese Nachricht erhalten hast.\nhttps://saai.wayshare.de:9090/api/signalmessage/liveticker?message=User${usernameWithoutSpaces}confirmedTheConfirmationMessage\n\nAh, und noch eine letzte Sache, bitte schreibe diesem Signal-Account keine Nachrichten, da sie nicht verarbeitet werden, und so nur den Bot verlangsamen.\nWenn es Probleme gibt, gehe bitte in der Schule zu Justus oder Jannik, sie werden dir hoffentlich helfen können.`,
            password: storedPassword
        };

        fetch('https://saai.wayshare.de:9090/api/signalmessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => {
                if (response.ok) {
                    alert('Verification message sent successfully.');
                } else {
                    alert('Failed to send verification message.');
                }
            })
            .catch(error => {
                console.error('Error sending verification message:', error);
                alert('There was an error sending the verification message. Please try again.');
            });
    }


    deleteTimetablesButton.addEventListener('click', function () { // New event listener
        const firstConfirmation = confirm("Are you sure you want to delete all timetables?");
        if (firstConfirmation) {
            const secondConfirmation = confirm("Are you really sure you want to continue?");
            if (secondConfirmation) {
                const requestBody = {
                    password: storedPassword // Use the stored password
                };

                fetch('https://saai.wayshare.de:9090/api/deleteAllTimetables', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                })
                    .then(response => {
                        if (response.ok) {
                            alert('All timetables have been successfully deleted.');
                            fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=WARNING:_All_timetables_deleated.`)
                        } else {
                            alert('Failed to delete timetables.');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting timetables:', error);
                        alert('There was an error deleting the timetables.');
                    });

            }
        }
    });


    const assignDutyGroupsButton = document.getElementById('assignDutyGroupsButton');
    assignDutyGroupsButton.addEventListener('click', function () {
        const firstConfirmation = confirm("Are you sure you want to assign duty groups to the timetable?");
        if (firstConfirmation) {
            const secondConfirmation = confirm("This action will assign duty groups to the timetable. Are you really sure?");
            if (secondConfirmation) {
                const requestBody = {
                    password: storedPassword // Use the stored password
                };

                fetch('https://saai.wayshare.de:9090/api/timetables/auto-generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                })
                    .then(response => {
                        if (response.ok) {
                            alert('Duty groups have been successfully assigned to the timetable.');
                            fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Duty_groups_assigned_to_timetable.`);
                        } else {
                            alert('Failed to assign duty groups to the timetable.');
                        }
                    })
                    .catch(error => {
                        console.error('Error assigning duty groups:', error);
                        alert('There was an error assigning duty groups to the timetable. Please try again.');
                    });
            }
        }
    });

document.addEventListener("DOMContentLoaded", function () {
    const notifyButton = document.getElementById('notifyDutyUsersButton');
    const deleteTimetablesButton = document.getElementById('deleteTimetablesButton'); // New button

    notifyButton.addEventListener('click', function () {
        const firstConfirmation = confirm("Are you sure you want to manually trigger notifying users on duty today?");
        if (firstConfirmation) {
            const secondConfirmation = confirm("Are you really sure you want to continue?");
            if (secondConfirmation) {
                fetch('https://saai.wayshare.de:9090/api/notifyDutyUsers', {
                    method: 'GET'
                })
                    .then(response => {
                        if (response.ok) {
                            alert('Users on duty today have been successfully notified.');
                        } else {
                            alert('Failed to notify users on duty.');
                        }
                    })
                    .catch(error => {
                        console.error('Error notifying duty users:', error);
                        alert('There was an error triggering the notification.');
                    });
            }
        }
    });
});

