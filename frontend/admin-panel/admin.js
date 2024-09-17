document.addEventListener("DOMContentLoaded", function () {
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('adminPassword');
    const submitButton = document.getElementById('submitPasswordButton');
    const passwordErrorMessage = document.getElementById('passwordErrorMessage');
    const adminContent = document.getElementById('adminContent');
    let storedPassword = '';

    // Show the password modal when the page loads
    passwordModal.style.display = 'flex';

    // Handle password submission on Enter key press
    passwordInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            submitPassword();
        }
    });

    // Function to submit the password
    function submitPassword() {
        const enteredPassword = passwordInput.value;

        const requestBody = {
            password: enteredPassword
        };

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
                    if (data[0].error.includes('400 BAD_REQUEST') || data[0].error.includes('401 UNAUTHORIZED')) {
                        passwordErrorMessage.style.display = 'block';
                        passwordErrorMessage.textContent = 'Incorrect password or password not entered. Please try again.';
                    }
                } else {
                    storedPassword = enteredPassword;
                    passwordModal.style.display = 'none';
                    adminContent.style.display = 'block';

                    displayUsers(data);
                }
            })
            .catch(error => {
                console.error('Error during the API request:', error);
                passwordErrorMessage.style.display = 'block';
                passwordErrorMessage.textContent = 'There was an error with the API request. Please try again later.';
            });
    }

    // Trigger password submission when the button is clicked
    submitButton.addEventListener('click', submitPassword);

    // Disable closing the modal by clicking outside
    passwordModal.addEventListener('click', function (event) {
        if (event.target === passwordModal) {
            event.stopPropagation();
        }
    });

    // Function to display users and allow updates to both experience and telephone number
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

            // Insert a small separator (line) between the username and experience level
            const separator1 = document.createElement('hr');
            separator1.className = 'small-separator';
            userRow.appendChild(separator1);

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

            // Add event listener to the experience dropdown
            experienceSelect.addEventListener('change', function () {
                const newExperience = experienceSelect.value;
                const confirmation = confirm(`Do you really want to change the experience level for ${user.username} to ${newExperience}?`);
                if (confirmation) {
                    updateExperience(user.username, newExperience);
                } else {
                    experienceSelect.value = user.experience; // Reset to original value if canceled
                }
            });

            experienceDiv.appendChild(experienceSelect);
            userRow.appendChild(experienceDiv);

            // Insert another small separator (line) between experience level and telephone number
            const separator2 = document.createElement('hr');
            separator2.className = 'small-separator';
            userRow.appendChild(separator2);

            const telephoneDiv = document.createElement('div');
            telephoneDiv.className = 'user-telephone';

            if (user.telephoneNumber === 'none' || !user.telephoneNumber) {
                const telephoneInput = document.createElement('input');
                telephoneInput.type = 'text';
                telephoneInput.placeholder = 'Enter telephone number';
                telephoneInput.className = 'user-experience';

                const setTelephoneButton = document.createElement('button');
                setTelephoneButton.textContent = 'Set Telephone Number';
                setTelephoneButton.className = 'user-experience';

                setTelephoneButton.addEventListener('click', function () {
                    const newNumber = telephoneInput.value;
                    const confirmation = confirm(`Do you really want to set the telephone number to ${newNumber} for ${user.username}?`);
                    if (confirmation) {
                        updateTelephoneNumber(user.username, newNumber);
                    }
                });

                telephoneDiv.appendChild(telephoneInput);
                telephoneDiv.appendChild(setTelephoneButton);
            } else {
                telephoneDiv.innerHTML = `Telephone Number: ${user.telephoneNumber} `;

                const clearTelephoneButton = document.createElement('button');
                clearTelephoneButton.textContent = 'Clear Telephone Number';
                clearTelephoneButton.className = 'user-experience';

                clearTelephoneButton.addEventListener('click', function () {
                    const confirmation = confirm(`Do you really want to clear the telephone number for ${user.username}?`);
                    if (confirmation) {
                        updateTelephoneNumber(user.username, 'none');
                    }
                });

                telephoneDiv.appendChild(clearTelephoneButton);
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
                    alert(`Telephone number for ${username} updated successfully.`);
                    // Re-fetch users after updating the telephone number
                    fetchUsers();
                } else {
                    alert(`Failed to update telephone number for ${username}.`);
                }
            })
            .catch(error => {
                console.error('Error updating telephone number:', error);
                alert('There was an error updating the telephone number. Please try again.');
            });
    }

    // Function to re-fetch users and update the UI
    function fetchUsers() {
        const requestBody = {
            password: storedPassword
        };

        fetch('https://saai.wayshare.de:9090/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())
            .then(data => {
                adminContent.innerHTML = ''; // Clear current content
                displayUsers(data); // Redisplay the updated user list
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                alert('There was an error fetching users. Please try again later.');
            });
    }

});
