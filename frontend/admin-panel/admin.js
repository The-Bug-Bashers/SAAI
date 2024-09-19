document.addEventListener("DOMContentLoaded", function () {
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('adminPassword');
    const submitButton = document.getElementById('submitPasswordButton');
    const passwordErrorMessage = document.getElementById('passwordErrorMessage');
    const adminContent = document.getElementById('adminContent');
    const messageContent = document.getElementById('messageContent');
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
        const requestBody = { password: enteredPassword };

        fetch('https://saai.wayshare.de:9090/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())
            .then(data => {
                if (data[0]?.error) {
                    passwordErrorMessage.style.display = 'block';
                    passwordErrorMessage.textContent = 'Incorrect password or password not entered. Please try again.';
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=WARNING:_Wrong_password_detected_at_Admin-Pannel_login_with_password:_${encodeURIComponent(enteredPassword)}`)
                } else {
                    storedPassword = enteredPassword;
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Succesfull_login_at_Admin-Panel`)
                    passwordModal.style.display = 'none';
                    adminContent.style.display = 'block';
                    loadMessageBox();
                    displayUsers(data);
                }
            })
            .catch(error => {
                console.error('Error during the API request:', error);
                passwordErrorMessage.style.display = 'block';
                passwordErrorMessage.textContent = 'There was an error with the API request. Please try again later.';
            });
    }

    function loadMessageBox() {
        fetch('https://saai.wayshare.de:9090/api/message')
            .then(response => response.json())
            .then(data => {
                const { stage, content } = data;
                messageContent.innerHTML = `<p>Current Message: ${content}</p>`;
                if (stage === 0) {
                    displaySetMessageForm();
                } else {
                    displayClearMessageButton(stage);
                }
            })
            .catch(error => {
                console.error('Error fetching message:', error);
                messageContent.innerHTML = `<p>Failed to load message. Please try again later.</p>`;
            });
    }

    function displaySetMessageForm() {
        messageContent.innerHTML += `
            <input type="text" id="newMessageContent" placeholder="Enter new message">
            <button id="setMessageButton">Set New Message</button>
        `;

        document.getElementById('setMessageButton').addEventListener('click', function () {
            const newMessage = document.getElementById('newMessageContent').value;
            if (!newMessage) {
                alert("Please enter a message.");
                return;
            }
            const confirmSet = confirm("Do you want to set this message?");
            if (confirmSet) {
                const stage = prompt("Set the message state:\n1: Notification\n2: Warning\n3: Issue", "1");
                if (stage >= 1 && stage <= 3) {
                    updateMessage(newMessage, parseInt(stage));
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=New_Message_set:_${encodeURIComponent(newMessage)}_with_stage:_${encodeURIComponent(stage)}`)
                } else {
                    alert("Invalid stage selected.");
                }
            }
        });
    }

    function displayClearMessageButton(stage) {
        const stageText = ["", "Notification", "Warning", "Issue"][stage];
        messageContent.innerHTML += `
            <p>Message Stage: ${stageText}</p>
            <button id="clearMessageButton">Clear Message</button>
        `;

        document.getElementById('clearMessageButton').addEventListener('click', function () {
            const confirmClear = confirm("Do you really want to clear the message?");
            if (confirmClear) {
                updateMessage("", 0);
                fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Message_cleared`)
            }
        });
    }

    function updateMessage(newContent, stage) {
        const requestBody = {
            password: storedPassword,
            content: newContent,
            stage: stage
        };

        fetch('https://saai.wayshare.de:9090/api/message', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => {
                if (response.ok) {
                    alert("Message updated successfully.");
                    loadMessageBox();
                } else {
                    alert("Failed to update message.");
                }
            })
            .catch(error => {
                console.error('Error updating message:', error);
                alert('There was an error updating the message. Please try again.');
            });
    }



    function displayUsers(data) {
        const userBox = document.createElement('div');
        userBox.className = 'user-box';
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
                setTelephoneButton.className = 'user-experience';

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
                clearTelephoneButton.className = 'user-experience';

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
                sendVerificationButton.className = 'user-experience';

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
        adminContent.appendChild(userBox);
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
                    alert(`Failed to update SIgnal-Username for ${username}.`);
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
            message: `Hallo ${username}, ich bin VaGABfS, ein Bot den Justus Programmiert hat um aufgaben im bereich signal zu automatisieren. \nBitte nim die unterhaltungsanfrage an, damit ich dich in zukunft mit nachrichten die den Schulsanitätsdienst betreffen erreichen kann. \n\nIch werde dir jeden tag wenn du dienst hast eine nachricht senden um dich daran zu erinnern ein gerät wo du auf der Sani-App angemeldet bist bei dir zu tragen. Diese nachricht wird dan auch einen link enthalten auf den du klicken kannst, wenn du an diesem tag nicht in der schule bist, dan wirst du automatisch aus dem dienstplan für diesen tag entfernt. \n\nWenn du diese nachricht empfangen hast klicke bitte auf den folgenden link, aber wundere dich nicht wenn du nur eine schwarze seite mit "message": "Signal message sent successfully" siehst, dies ist gewollt und der link informiert die Administratoren, das du diese nachricht erhalten hast. \nDer link ist: https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=User${usernameWithoutSpaces}confirmedTheConfirmationMessage\n\nAh, und noch eine letzte sache, bitte schreibe diesem signal-account keine nachrichten, da sie nicht verarbeitet werden, und so nur den Bot verlangsamen. \nwenn es probleme gibt gehe bitte in der Schule zu Justus oder Jannik, sie werden dir hoffentlich helfen können.`,
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

    function fetchUsers() {
        const requestBody = { password: storedPassword };

        fetch('https://saai.wayshare.de:9090/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())
            .then(data => {
                adminContent.innerHTML = '';
                displayUsers(data);
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                alert('There was an error fetching users. Please try again later.');
            });
    }










});

































