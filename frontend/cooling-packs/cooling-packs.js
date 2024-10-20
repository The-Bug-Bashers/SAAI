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
                fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=WARNING:_Wrong_password_detected_at_Cooling-pack_page_login_with_password:_${encodeURIComponent(enteredPassword)}`);
            } else if (response.ok) {
                return response.json();
            } else {
                throw new Error('Unexpected response status: ' + response.status);
            }
        })
        .then(data => {
            if (data) {
                storedPassword = enteredPassword;
                fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Succesfull_login_at_Cooling-pack_page`);
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
        coolingpackBox.innerHTML = `<h1>Kühlpacks</h1><hr class="big-separator">`;

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
                borowDiv.innerHTML = `Verliehen von: <strong>${coolingpack.givenBy}</strong><br> Geliehen von: <strong>${coolingpack.borrowedBy}</strong>`;


                const setReturnButton = document.createElement('button');
                setReturnButton.textContent = 'Zurückgeben';

                setReturnButton.addEventListener('click', function () {
                    const confirmation = confirm(`Möchtest du wirklich das Kühlpack: ${coolingpack.name} zurückgeben?`);
                    if (confirmation) {

                        const requestBody = {
                            borrowed: false,
                            givenBy: null,
                            borrowedBy: null,
                            password: storedPassword
                        };
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Coolingpack:_${coolingpack.name},_gelihen_von:_${coolingpack.borrowedBy},_verlihen von:_${coolingpack.givenBy}_wurde_zurückgegeben.`)
                        fetch('https://saai.wayshare.de:9090/api/coolingpacks/' + coolingpack.id, {
                            method: 'PUT',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(requestBody)
                        })
                    }
                });

                borowDiv.appendChild(setReturnButton);
            } else {
                borowDiv.innerHTML = `SigReturnnal-Coolingpackname: ${coolingpack.telephoneNumber} `;

                const clearReturnButton = document.createElement('button');
                clearReturnButton.textContent = 'Clear Signal-Coolingpackname';

                clearReturnButton.addEventListener('click', function () {
                    const confirmation = confirm(`Do you really want to clear the Signal-Coolingpackname for ${coolingpack.coolingpackname}?`);
                    if (confirmation) {
                        updateTelephoneNumber(coolingpack.coolingpackname, 'none');
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Signal-Coolingpackname_cleared_for_${coolingpack.coolingpackname}.`)
                    }
                });

                borowDiv.appendChild(clearReturnButton);

                // Add "Send Verification Message" button
                const sendVerificationButton = document.createElement('button');
                sendVerificationButton.textContent = 'Send Verification Message';

                sendVerificationButton.addEventListener('click', function () {
                    const confirmation = confirm(`Do you really want to send a verification message to ${coolingpack.telephoneNumber} for ${coolingpack.coolingpackname}?`);
                    if (confirmation) {
                        sendVerificationMessage(coolingpack.telephoneNumber, coolingpack.coolingpackname);
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Verification_message_send_to_${coolingpack.coolingpackname}.`)
                    }
                });

                borowDiv.appendChild(sendVerificationButton);
            }

            coolingpackRow.appendChild(borowDiv);
            coolingpacksContainer.appendChild(coolingpackRow);
        });

        coolingpackBox.appendChild(coolingpacksContainer);
        adminContent.appendChild(coolingpackBox);
    }


    // DAS HIER WURDE SCHON BEARBEITET!!! //
    //             WIRKLICH!!!            //
    //            ECHT JETZT!!!           //
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