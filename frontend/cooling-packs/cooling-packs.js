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
            .then(response => response.json())
            .then(data => {
                if (data[0]?.error) {
                    passwordErrorMessage.style.display = 'block';
                    passwordErrorMessage.textContent = 'Falsches Passwort';
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=WARNING:_Wrong_password_detected_at_Cooling-pack_page_login_with_password:_${encodeURIComponent(enteredPassword)}`)
                } else {
                    storedPassword = enteredPassword;
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Succesfull_login_at_Cooling-pack_page`)
                    passwordModal.style.display = 'none';
                    adminContent.style.display = 'block';
                    displayCoolingpacks(data);
                }
            })
            .catch(error => {
                console.error('Error during the API request:', error);
                passwordErrorMessage.style.display = 'block';
                passwordErrorMessage.textContent = 'Es gab einen Fehler bei der API request.';
            });
    }


    function displayCoolingpacks(data) {
        const coolingpackBox = document.createElement('div');
        coolingpackBox.className = 'coolingpack-box';
        coolingpackBox.innerHTML = `<h1>Kühlpacks</h1><hr class="big-separator">`;

        const coolingpacksContainer = document.createElement('section');
        coolingpacksContainer.id = 'coolingpacksContainer';

        data.forEach(coolingpack => {
            const coolingpackRow = document.createElement('div');
            coolingpackRow.className = 'coolingpack-row';

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'coolingpack-details';
            detailsDiv.innerHTML = `<strong>${coolingpack.coolingpackname}</strong><br>`;
            coolingpackRow.appendChild(detailsDiv);

            // const experienceDiv = document.createElement('div');
            // experienceDiv.className = 'coolingpack-experience';
            // const experienceLabel = document.createElement('span');
            // experienceLabel.textContent = 'Experience level: ';
            // experienceDiv.appendChild(experienceLabel);

            // const experienceSelect = document.createElement('select');
            experienceLevels.forEach(level => {
                const option = document.createElement('option');
                option.value = level;
                option.text = level;
                if (coolingpack.experience === level) {
                    option.selected = true;
                }
                experienceSelect.appendChild(option);
            });

            // experienceSelect.addEventListener('change', function () {
            //     const newExperience = experienceSelect.value;
            //     const confirmation = confirm(`Do you really want to change the experience level for ${coolingpack.coolingpackname} to ${newExperience}?`);
            //     if (confirmation) {
            //         updateExperience(coolingpack.coolingpackname, newExperience);
            //         fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Experience_level_changed_for_${coolingpack.coolingpackname}_to_${newExperience}.`)
            //     } else {
            //         experienceSelect.value = coolingpack.experience;
            //     }
            // });

            experienceDiv.appendChild(experienceSelect);
            coolingpackRow.appendChild(experienceDiv);

            const telephoneDiv = document.createElement('div');
            telephoneDiv.className = 'coolingpack-telephone';

            if (coolingpack.telephoneNumber === 'none' || !coolingpack.telephoneNumber) {
                const telephoneInput = document.createElement('input');
                telephoneInput.type = 'text';
                telephoneInput.placeholder = 'Example.64';
                telephoneInput.className = 'coolingpack-experience';

                const setTelephoneButton = document.createElement('button');
                setTelephoneButton.textContent = 'Set Signal-Coolingpackname';

                setTelephoneButton.addEventListener('click', function () {
                    const newNumber = telephoneInput.value;
                    const confirmation = confirm(`Do you really want to set the Signal-Coolingpackname to ${newNumber} for ${coolingpack.coolingpackname}?`);
                    if (confirmation) {
                        updateTelephoneNumber(coolingpack.coolingpackname, newNumber);
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Signal-Coolingpackname_set_to_${newNumber}_for_${coolingpack.coolingpackname}.`)
                    }
                });

                telephoneDiv.appendChild(telephoneInput);
                telephoneDiv.appendChild(setTelephoneButton);
            } else {
                telephoneDiv.innerHTML = `Signal-Coolingpackname: ${coolingpack.telephoneNumber} `;

                const clearTelephoneButton = document.createElement('button');
                clearTelephoneButton.textContent = 'Clear Signal-Coolingpackname';

                clearTelephoneButton.addEventListener('click', function () {
                    const confirmation = confirm(`Do you really want to clear the Signal-Coolingpackname for ${coolingpack.coolingpackname}?`);
                    if (confirmation) {
                        updateTelephoneNumber(coolingpack.coolingpackname, 'none');
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Signal-Coolingpackname_cleared_for_${coolingpack.coolingpackname}.`)
                    }
                });

                telephoneDiv.appendChild(clearTelephoneButton);

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

                telephoneDiv.appendChild(sendVerificationButton);
            }

            coolingpackRow.appendChild(telephoneDiv);
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