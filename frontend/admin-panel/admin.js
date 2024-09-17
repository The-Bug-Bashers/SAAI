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
                if (data.error) {
                    if (data.error.includes('400 BAD_REQUEST') || data.error.includes('401 UNAUTHORIZED')) {
                        passwordErrorMessage.style.display = 'block';
                        passwordErrorMessage.textContent = 'Incorrect password or password not entered. Please try again.';
                    }
                } else {
                    storedPassword = enteredPassword;  // Store password for later use
                    passwordModal.style.display = 'none';  // Hide modal
                    adminContent.style.display = 'block';  // Show admin content

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

    // Function to display users and experiences with dropdowns for updating experience
    function displayUsers(data) {
        const userBox = document.createElement('div');
        userBox.className = 'user-box';
        userBox.innerHTML = `<h1>User Administration</h1>`;

        const usersContainer = document.createElement('section');
        usersContainer.id = 'usersContainer';

        // Experience levels
        const experienceLevels = ['freshman', 'advanced', 'super-mega-hyper-boss'];

        // Loop through the response data and create user rows
        Object.keys(data).forEach(user => {
            const userRow = document.createElement('div');
            userRow.className = 'user-row';

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'user-details';
            detailsDiv.innerHTML = `<strong>User:</strong> ${user}`;

            const experienceDiv = document.createElement('div');
            experienceDiv.className = 'user-experience';

            // Create a dropdown to change the experience level
            const experienceSelect = document.createElement('select');
            experienceLevels.forEach(level => {
                const option = document.createElement('option');
                option.value = level;
                option.text = level;
                if (data[user] === level) {
                    option.selected = true;
                }
                experienceSelect.appendChild(option);
            });

            // Update experience when the dropdown changes
            experienceSelect.addEventListener('change', function () {
                updateExperience(user, experienceSelect.value);
            });

            experienceDiv.appendChild(experienceSelect);
            userRow.appendChild(detailsDiv);
            userRow.appendChild(experienceDiv);
            usersContainer.appendChild(userRow);
        });

        userBox.appendChild(usersContainer);
        adminContent.appendChild(userBox);
    }

    // Function to update the user's experience level
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
});
