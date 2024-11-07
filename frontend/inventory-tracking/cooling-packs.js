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

        data.forEach(coolingpack => {

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
                    const confirmation = confirm(`Willst du wirklich ${coolingpack.name} ausleihen?`);
                    if (confirmation) {
                        const givenBy = prompt('Bitte deinen Namen eingeben (der Verleiher):');
                        const borrowedBy = prompt('Bitte den Namen der Person eingeben, die den Gegenstand ausleiht:');

                        if (givenBy && borrowedBy) {
                            const requestBody = {
                                borrowed: true,
                                givenBy: givenBy,
                                borrowedBy: borrowedBy,
                                password: storedPassword
                            };
                            fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Item_got_borrowed:_${encodeURIComponent('\n')}Item name: ${coolingpack.name}${encodeURIComponent('\n')}lent_by:_${givenBy}_${encodeURIComponent('\n')}borrowed_by:_${borrowedBy}.`)
                            fetch('https://saai.wayshare.de:9090/api/coolingpacks/' + coolingpack.id, {
                                method: 'PUT',
                                headers: {'Content-Type': 'application/json'},
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
                                });
                        } else {
                            alert('Bitte alle Namen angeben, um das Kühlpack auszuleihen.');
                        }
                    }
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
});