document.addEventListener("DOMContentLoaded", function () {
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('adminPassword');
    const submitButton = document.getElementById('submitPasswordButton');
    const passwordErrorMessage = document.getElementById('passwordErrorMessage');
    const adminContent = document.getElementById('adminContent');
    let storedPassword = '';

    // Show the password modal when the page loads
    passwordModal.style.display = 'flex';

    // Function to display users and experiences
    function displayUsers(data) {
        const userBox = document.createElement('div');
        userBox.className = 'user-box';
        userBox.innerHTML = `<h1>Users and Experience</h1>`;

        const usersContainer = document.createElement('section');
        usersContainer.id = 'usersContainer';

        // Loop through the response data and create user rows
        Object.keys(data).forEach(user => {
            const userRow = document.createElement('div');
            userRow.className = 'user-row';

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'user-details';
            detailsDiv.innerHTML = `<strong>User:</strong> ${user}`;

            const experienceDiv = document.createElement('div');
            experienceDiv.className = 'user-experience';
            experienceDiv.innerHTML = `<strong>Experience level:</strong> ${data[user]}`;

            userRow.appendChild(detailsDiv);
            userRow.appendChild(experienceDiv);
            usersContainer.appendChild(userRow);
        });

        userBox.appendChild(usersContainer);
        adminContent.appendChild(userBox);
    }

    // Function to handle password submission
    submitButton.addEventListener('click', function () {
        const enteredPassword = passwordInput.value;

        // Prepare the POST request body
        const requestBody = {
            password: enteredPassword
        };

        // Send POST request to the API with the entered password
        fetch('https://saai.wayshare.de:9090/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())
            .then(data => {
                // Check if the API returned an error
                if (data.error) {
                    if (data.error.includes('400 BAD_REQUEST') || data.error.includes('401 UNAUTHORIZED')) {
                        // Display error message and reprompt the user
                        passwordErrorMessage.style.display = 'block';
                        passwordErrorMessage.textContent = 'Incorrect password or password not entered. Please try again.';
                    }
                } else {
                    // Password is correct, hide the modal and display admin content
                    storedPassword = enteredPassword;  // Store the password for later use
                    passwordModal.style.display = 'none';  // Hide modal
                    adminContent.style.display = 'block';  // Show admin content

                    // Display users and experiences
                    displayUsers(data);
                }
            })
            .catch(error => {
                console.error('Error during the API request:', error);
                // Display error message if there's an issue with the API call itself
                passwordErrorMessage.style.display = 'block';
                passwordErrorMessage.textContent = 'There was an error with the API request. Please try again later.';
            });
    });

    // Disable closing the modal by clicking outside
    passwordModal.addEventListener('click', function (event) {
        if (event.target === passwordModal) {
            event.stopPropagation();
        }
    });
});
