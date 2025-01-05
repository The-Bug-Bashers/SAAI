const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

let storedPassword; // the password wich was provided by teh user upon login
let userList = []; // list of all users

const inventoryBox = document.querySelector(".inventoryBox");
const itemContainer = document.getElementById("itemContainer");

document.addEventListener("DOMContentLoaded", function () {

    /* Password modal */
    modalContent.innerHTML = `
        <p>Bitte gib das Passwort ein, um die Inventar-Verleih-Seite aufzurufen:</p>
        <p id="errorMessage"><!--error message gets inserted here--></p>
        <div class="input-group" id="passwordInputDiv">
            <input required type="password" id="passwordInput" class="input">
                <label class="user-label" id="passwordInputLable">Passwort eingeben</label>
            </div>
        <button id="submitPasswordButton" class="button">Bestätigen</button>
    `;

    document.getElementById("passwordInput").addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            submitPassword();
        }
    });
    document.getElementById("submitPasswordButton").addEventListener('click', submitPassword);
});

function submitPassword() {
    const enteredPassword = document.getElementById("passwordInput").value;

    if (!enteredPassword) {
        constructInnerHtmlForErrorMessage(document.getElementById("errorMessage"), "Kein Password eingegeben.",null);
        return;
    }

    fetch(`${InventoryTrackingAPiUrl}?password=` + enteredPassword, {
        method: 'GET',
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 401) {
                constructInnerHtmlForErrorMessage(document.getElementById("errorMessage"), "Falsches Passwort.", "Falls du dir sicher bist das richtige password eingegeben zu haben, ");
                fetch(`${livetickerApiUrl}?message=WARNING:_Wrong_password_detected_at_Inventory-tracking_page._Login_with_password:_${encodeURIComponent(enteredPassword)}`);
            } else {
                throw new Error('Unexpected response status: ' + response.status);
            }
        })
        .then(data => {
            if (data) {
                storedPassword = enteredPassword;
                fetchUserList();
                fetch(`${livetickerApiUrl}?message=Successful_login_at_Inventory-tracking_page`);
                modal.style.display = 'none';
                inventoryBox.style.display = 'block';
                displayInventory(data);
            }
        })
        .catch(error => {
            console.error('Error during the API request:', error);
            constructInnerHtmlForErrorMessage(document.getElementById("errorMessage"), "Ein Fehler ist aufgetreten. Bitte versuche es noch einmal.", "Wen er weiterhin bestehen bleibt, ");
        });
}

function fetchUserList() {
    fetch(usersApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: storedPassword })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user list. Response status:' + response.status);
            }
            return response.json();
        })
        .then(data => {
            userList = data.map(user => user.username); // Extract usernames from the response
        })
        .catch(error => {
            displayError("Error fetching user list.", error)
        });
}

function displayInventory(data) {

    const sortedItems = data.sort((a, b) => {
        const extractNumber = (name) => {
            const match = name.match(/\d+/);
            return match ? parseInt(match[0], 10) : null;
        };

        const nameA = a.name;
        const nameB = b.name;
        const numberA = extractNumber(nameA);
        const numberB = extractNumber(nameB);
        if (nameA.startsWith("Kühlpack") && nameB.startsWith("Kühlpack") && numberA !== null && numberB !== null) {
            return numberA - numberB;
        }

        return nameA.localeCompare(nameB);
    });

    sortedItems.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'box-row';

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'box-row-header';

        // Add max lending duration display
        const maxLendingDuration = item.maxLendingDuration
            ? `${item.maxLendingDuration} Tage`
            : "Keine Begrenzung";

        detailsDiv.innerHTML = `
            <div style="  display: flex; flex-wrap: wrap; align-items: flex-start;">
                <strong style="flex: 1 1 auto;">${item.name}</strong><span style="align-self: flex-end;">max. Ausleihdauer: <strong>${maxLendingDuration}</strong></span>
            </div>
        `;
        itemRow.appendChild(detailsDiv);

        const borrowDiv = document.createElement('div');
        borrowDiv.className = 'itemBorrowDiv';

        if (item.borrowed) {
            let dateParts = item.borrowedDate.split('-');
            let formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
            borrowDiv.innerHTML = `
                Herausgegeben von: <strong>${item.givenBy}</strong><br>
                geliehen von: <strong>${item.borrowedBy}</strong><br>
                am: <strong>${formattedDate}</strong><br>
            `;

            const returnButton = document.createElement('button');
            returnButton.textContent = 'Zurückgeben';
            returnButton.className = 'button';

            returnButton.addEventListener('click', function () {

                /* Confirmation modal */
                modalContent.innerHTML = `
                    <p>${item.name} zurückgeben?</p>
                    <div id="buttonDiv" style="display: flex">
                        <button id="returnButton" class="button">Abbrechen</button>
                        <button id="continueButton" style="margin-left: auto" class="button">Bestätigen</button>
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

                    const requestBody = {
                        borrowed: false,
                        givenBy: null,
                        borrowedBy: null,
                        password: storedPassword
                    };
                    fetch(`${InventoryTrackingAPiUrl}/` + item.id, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    })
                    .then(response => {
                        if (response.ok) {
                            displayNotification("Der Gegenstand wurde erfolgreich zurückgegeben.")
                            fetch(`${livetickerApiUrl}?message=Item got returned:${encodeURIComponent('\n')}Item name:_${item.name}${encodeURIComponent('\n')}borrowed_by:_${item.borrowedBy}${encodeURIComponent('\n')}lent_by:_${item.givenBy}`);
                            fetchItems();
                        } else {
                            throw new Error('Unexpected response status: ' + response.status);
                        }
                    })
                    .catch(error => {
                        displayError("Error lending item.", error);
                    });
                });
            });

            borrowDiv.appendChild(returnButton);
        } else {
            itemRow.classList.add('box-row-highlight');
            borrowDiv.innerHTML = `Nicht verliehen<br>`;
            const lendButton = document.createElement('button');
            lendButton.className = 'button';
            lendButton.textContent = 'Ausleihen';

            lendButton.addEventListener('click', function () {

                modalContent.innerHTML = `
                    <h2>${item.name} ausleihen?</h2>
                    <div id="givenByDiv" style="justify-content: center">
                        <label for="givenBySelect" style="margin-right: 0.5em">Verleiher: </label><br>
                        <select id="givenBySelect" style="">
                            ${userList.map(user => `<option value="${user}">${user}</option>`).join('')}
                        </select><br>
                    </div>
                    <div class="input-group" id="borrowedByInputDiv">
                        <input required type="text" id="borrowedByInput" class="input">
                        <label class="user-label" id="passwordInputLable">Patient</label>
                    </div>
                    <p id="errorMessage"><!--error message gets inserted here--></p>
                    <div class="modal-actions">
                        <button id="cancelLend" class="button">Abbrechen</button>
                        <button id="confirmLend" class="button">Bestätigen</button>
                    </div>
                `;
                document.body.classList.add('modal-open');
                modal.style.display = 'flex';

                document.getElementById('cancelLend').addEventListener('click', function () {
                    document.body.classList.remove('modal-open');
                    modal.style.display = 'none';
                });

                document.getElementById('confirmLend').addEventListener('click', function () {

                    const givenBy = document.getElementById('givenBySelect').value;
                    const borrowedBy = document.getElementById('borrowedByInput').value;

                    if (borrowedBy.trim() === '') {
                        constructInnerHtmlForErrorMessage(document.getElementById("errorMessage"), "Bitte gib den namen des Patienten an.", null);
                        return;
                    }

                    const requestBody = {
                        borrowed: true,
                        givenBy: givenBy,
                        borrowedBy: borrowedBy,
                        password: storedPassword
                    };

                    document.body.classList.remove('modal-open');
                    modal.style.display = 'none';

                    fetch(`${livetickerApiUrl}?message=Item_got_borrowed:_${encodeURIComponent('\n')}Item name: ${item.name}${encodeURIComponent('\n')}lent_by:_${givenBy}_${encodeURIComponent('\n')}borrowed_by:_${borrowedBy}`);
                    fetch(`${InventoryTrackingAPiUrl}/` + item.id, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody)
                    })
                        .then(response => {
                            if (response.ok) {
                                displayNotification("Der gegenstand wurde erfolgreich ausgeliehen");
                                fetchItems();
                            } else {
                                throw new Error('Unexpected response status: ' + response.status);
                            }
                        })
                        .catch(error => {
                            console.error('Error lending item', error);
                            displayError("Error lending item.", error, );
                        })
                });
            });
            borrowDiv.appendChild(lendButton);
        }
        itemRow.appendChild(borrowDiv);
        itemContainer.appendChild(itemRow);
    });
    inventoryBox.appendChild(itemContainer);
}

function fetchItems() {
    fetch(`${InventoryTrackingAPiUrl}?password=` + storedPassword, {
        method: 'GET',
    })
        .then(response => response.json())
        .then(data => {
            itemContainer.innerHTML = '';
            displayInventory(data);
        })
        .catch(error => {
            displayError("Error fetching Items.", error);
        });
}