document.addEventListener("DOMContentLoaded", function () {
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('adminPassword');
    const submitButton = document.getElementById('submitPasswordButton');
    const passwordErrorMessage = document.getElementById('passwordErrorMessage');
    const adminContent = document.getElementById('adminContent');
    let storedPassword = '';

    // Initial password modal show
    passwordModal.style.display = 'flex';

    passwordInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            submitPassword();
        }
    });

    submitButton.addEventListener('click', submitPassword);

    passwordModal.addEventListener('click', function (event) {
        if (event.target === passwordModal) {
            event.stopPropagation();
        }
    });

    function submitPassword() {
        const enteredPassword = passwordInput.value;

        fetch('https://saai.wayshare.de:9090/api/coolingpacks?password=' + enteredPassword, {
            method: 'GET',
        })
        .then(response => {
            if (response.status === 401) {
                passwordErrorMessage.style.display = 'block';
                passwordErrorMessage.textContent = 'Falsches Passwort';
                fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=WARNING:_Wrong_password_detected_at_Inventory-tracking_page._Login_with_password:_${encodeURIComponent(enteredPassword)}`);
            } else if (response.ok) {
                return response.json();
            } else {
                throw new Error('Unexpected response status: ' + response.status);
            }
        })
        .then(data => {
            if (data) {
                storedPassword = enteredPassword;
                fetchUserList();
                fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Succesfull_login_at_Inventory-tracking_page`);
                passwordModal.style.display = 'none';
                adminContent.style.display = 'block';
                displayCoolingpacks(data);
            }
        })
        .catch(error => {
            console.error('Error during the API request:', error);
            passwordErrorMessage.style.display = 'block';
            passwordErrorMessage.textContent = 'There was an error with the API request. Please try again later.';
        });
    }


    function displayCoolingpacks(data) {
        const coolingpackBox = document.createElement('div');
        coolingpackBox.className = 'coolingpack-box';
        coolingpackBox.innerHTML = `<h1>Inventar</h1><hr class="big-separator">`;

        const coolingpacksContainer = document.createElement('section');
        coolingpacksContainer.id = 'coolingpacksContainer';

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
        console.log(sortedItems)

        sortedItems.forEach(coolingpack => {

            console.log(coolingpack)
            const coolingpackRow = document.createElement('div');
            coolingpackRow.className = 'coolingpack-row';

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'coolingpack-details';
            detailsDiv.innerHTML = `<strong>${coolingpack.name}</strong><br>`;
            coolingpackRow.appendChild(detailsDiv);

            const borowDiv = document.createElement('div');
            borowDiv.className = 'coolingpack-borow';

            if (coolingpack.borrowed === true) {
                let dateParts = coolingpack.borrowedDate.split('-');
                let formattedDate = dateParts[2] + '.' + dateParts[1] + '.' + dateParts[0];
                borowDiv.innerHTML = `Verliehen von: <strong>${coolingpack.givenBy}</strong><br> Geliehen von: <strong>${coolingpack.borrowedBy}</strong><br>Geliehen am: <strong>${formattedDate}</strong><br>`;


                const setReturnButton = document.createElement('button');
                setReturnButton.textContent = 'Zurückgeben';
                setReturnButton.className = 'returnButton';

                setReturnButton.addEventListener('click', function () {
                    const confirmation = confirm(`Möchtest du wirklich: ${coolingpack.name} zurückgeben?`);
                    if (confirmation) {

                        const requestBody = {
                            borrowed: false,
                            givenBy: null,
                            borrowedBy: null,
                            password: storedPassword
                        };
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Item got returned:${encodeURIComponent('\n')}Item name:_${coolingpack.name}${encodeURIComponent('\n')}borrowed_by:_${coolingpack.borrowedBy}${encodeURIComponent('\n')}lent_by:_${coolingpack.givenBy}`)
                        fetch('https://saai.wayshare.de:9090/api/coolingpacks/' + coolingpack.id, {
                            method: 'PUT',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(requestBody)
                        })
                            .then(response => {
                                if (response.ok) {
                                    alert('Der Gegenstand wurde erfolgreich zurückgegeben.');
                                    fetchCoolingpacks();
                                } else {
                                    alert('Fehler beim Ausleihen des Kühlpacks.');
                                }
                            })
                            .catch(error => {
                                console.error('Error lending cooling pack:', error);
                                alert('Es gab einen Fehler beim Ausleihen des Kühlpacks. Bitte versuche es erneut.');
                            });
                    }
                });

                borowDiv.appendChild(setReturnButton);
            } else {
                borowDiv.innerHTML = `Gegenstand nicht ausgeliehen<br>`;
                const lendButton = document.createElement('button');
                lendButton.className = 'returnButton';
                lendButton.textContent = 'Ausleihen';

                lendButton.addEventListener('click', function () {
                        // Create a modal for the selection and text input
                        const modal = document.createElement('div');
                        modal.className = 'user-selection-modal';
                        modal.innerHTML = `
            <div class="modal-content">
                <h2>Bitte angeben, von wem an wen verliehen wird</h2>
                <label for="givenBySelect">Verleiher auswählen:</label>
                <select id="givenBySelect">
                    ${userList.map(user => `<option value="${user}">${user}</option>`).join('')}
                </select><br><br>
                <label for="borrowedByInput">Entleiher eingeben:</label>
                <input type="text" id="borrowedByInput" placeholder="Name des patienten" />
                <div class="modal-actions">
                    <button id="cancelLend">Abbrechen</button>
                    <button id="confirmLend">Bestätigen</button>
                </div>
            </div>
        `;
                        document.body.appendChild(modal);

                        // Handle modal actions
                        document.getElementById('confirmLend').addEventListener('click', function () {
                            const givenBy = document.getElementById('givenBySelect').value;
                            const borrowedBy = document.getElementById('borrowedByInput').value;

                            if (borrowedBy.trim() === '') {
                                alert('Bitte einen Namen für den Entleiher eingeben.');
                                return;
                            }

                            const requestBody = {
                                borrowed: true,
                                givenBy: givenBy,
                                borrowedBy: borrowedBy,
                                password: storedPassword
                            };

                            // Send the live ticker update
                            fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Item_got_borrowed:_${encodeURIComponent('\n')}Item name: ${coolingpack.name}${encodeURIComponent('\n')}lent_by:_${givenBy}_${encodeURIComponent('\n')}borrowed_by:_${borrowedBy}`);
                            // Send the PUT request
                            fetch('https://saai.wayshare.de:9090/api/coolingpacks/' + coolingpack.id, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(requestBody)
                            })
                                .then(response => {
                                    if (response.ok) {
                                        alert('Der Gegenstand wurde erfolgreich ausgeliehen.');
                                        fetchCoolingpacks();
                                    } else {
                                        alert('Fehler beim Ausleihen des Kühlpacks.');
                                    }
                                })
                                .catch(error => {
                                    console.error('Error lending cooling pack:', error);
                                    alert('Es gab einen Fehler beim Ausleihen des Kühlpacks. Bitte versuche es erneut.');
                                })
                                .finally(() => {
                                    document.body.removeChild(modal); // Close modal
                                });
                        });

                        document.getElementById('cancelLend').addEventListener('click', function () {
                            document.body.removeChild(modal); // Close modal
                        });
                });



                borowDiv.appendChild(lendButton);
            }

            coolingpackRow.appendChild(borowDiv);
            coolingpacksContainer.appendChild(coolingpackRow);
        });

        coolingpackBox.appendChild(coolingpacksContainer);
        adminContent.appendChild(coolingpackBox);
    }

    function fetchCoolingpacks() {
        fetch('https://saai.wayshare.de:9090/api/coolingpacks?password=' + storedPassword, {
            method: 'GET',
        })
            .then(response => response.json())
            .then(data => {
                adminContent.innerHTML = '';
                displayCoolingpacks(data);
            })
            .catch(error => {
                console.error('Error fetching coolingpacks:', error);
                alert('There was an error fetching coolingpacks. Please try again later.');
            });
    }



    let userList = []; // Store the fetched user list globally

    function fetchUserList() {
        return fetch('https://saai.wayshare.de:9090/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: storedPassword })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch user list.');
                }
                return response.json();
            })
            .then(data => {
                userList = data.map(user => user.username); // Extract usernames from the response
            })
            .catch(error => {
                console.error('Error fetching user list:', error);
                alert('Error fetching user list. Please try again later.');
            });
    }

});
