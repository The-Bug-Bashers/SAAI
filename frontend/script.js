const url = 'http://172.105.89.210:8080';

function sendAlert() {
    const data = {
        room: document.getElementById('room').value,
        description: document.getElementById('description').value,
    };

    fetch(url + '/alerts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(jsonResponse => {
            console.log(jsonResponse);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}
