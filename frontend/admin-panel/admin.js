document.addEventListener("DOMContentLoaded", function() {
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('adminPassword');
    const submitButton = document.getElementById('submitPasswordButton');
    const passwordErrorMessage = document.getElementById('passwordErrorMessage');
    const adminContent = document.getElementById('adminContent');

    // Show the password modal when the page loads
    passwordModal.style.display = 'flex';

    // Handle password submission
    submitButton.addEventListener('click', function() {
        const enteredPassword = passwordInput.value;

        // Close the modal and show the admin content regardless of password
        passwordModal.style.display = 'none';
        adminContent.style.display = 'block';

        // Send API request with the entered password
        const apiUrl = `https://saai.wayshare.de:9090/api/users?password=${encodeURIComponent(enteredPassword)}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log("API Response:", data);
                // Handle the API response here (e.g., display user data, etc.)
            })
            .catch(error => {
                console.error('Error during the API request:', error);
                passwordErrorMessage.style.display = 'block'; // Show error message if API call fails
            });
    });

    // Disable closing the modal by clicking outside
    passwordModal.addEventListener('click', function(event) {
        if (event.target === passwordModal) {
            event.stopPropagation();
        }
    });
});
