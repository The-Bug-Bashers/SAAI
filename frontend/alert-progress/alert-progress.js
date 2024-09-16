document.addEventListener("DOMContentLoaded", function() {
    const acceptedUsersContainer = document.getElementById('acceptedUsersContainer');
    const loadingMessage = document.getElementById('loadingMessage');

    // Extract alert_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const alertId = urlParams.get('alert_id');

    if (!alertId) {
        acceptedUsersContainer.innerHTML = '<p style="color: red;">Keine gültige Alarm-ID gefunden.</p>';
        return;
    }

    // Function to fetch accepted users
    function fetchAcceptedUsers() {
        fetch(`https://saai.wayshare.de:9090/api/alerts/accepted-users/${alertId}`)
            .then(response => response.json())
            .then(data => {
                // Log the API response for debugging
                console.log('API response:', data);

                loadingMessage.style.display = 'none';

                if (data && data.length > 0) {
                    // Clear the container and add accepted users
                    acceptedUsersContainer.innerHTML = ''; // Clear previous content
                    data.forEach(user => {
                        const userElement = document.createElement('p');
                        userElement.textContent = `User: ${user}`; // Directly display the user name
                        acceptedUsersContainer.appendChild(userElement);
                    });
                } else {
                    acceptedUsersContainer.innerHTML = '<p>Keine Benutzer haben den Alarm angenommen.</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching accepted users:', error);
                acceptedUsersContainer.innerHTML = '<p style="color: red;">Fehler beim Laden der angenommenen Benutzer.</p>';
                loadingMessage.style.display = 'none';
            });
    }

    // Fetch users every second
    fetchAcceptedUsers(); // Initial fetch on page load
    setInterval(fetchAcceptedUsers, 1000); // Fetch every 1 second (1000 ms)
});
