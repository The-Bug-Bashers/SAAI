const url = 'http://172.105.246.203:8080';

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

    redirect("alert-progress");
}

function redirect(page) {
    window.location.href = page;
}

function fetchTimetable() {
    fetch(url + '/infoscreen')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(apiResponse => {
            const timetableContainer = document.getElementById('timetableContainer');
            timetableContainer.innerHTML = '';

            // Add the next_active information
            const nextActiveInfo = document.createElement('div');
            nextActiveInfo.classList.add('next-active');
            nextActiveInfo.innerHTML = `<strong>Next Active:</strong> ${apiResponse.next_active}`;
            timetableContainer.appendChild(nextActiveInfo);

            apiResponse.events.forEach(entry => {
                const startTime = entry.start_time;
                const endTime = entry.end_time;
                const responsibleUsers = entry.responsible_users;
                const isActive = entry.is_active;

                const timetableRow = document.createElement('div');
                timetableRow.classList.add('timetable-row');
                if (isActive) {
                    timetableRow.classList.add('active-timetable');
                }

                timetableRow.innerHTML = `
                    <div class="timetable-details">
                        <div><strong>Start:</strong> ${startTime}</div>
                        <div><strong>Ende:</strong> ${endTime}</div>
                    </div>
                    <div class="responsible-users"><strong>Dienst haben:</strong> ${responsibleUsers.join(', ')}</div>
                `;

                timetableContainer.appendChild(timetableRow);
            });
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

// Call fetchTimetable when the document is loaded
document.addEventListener("DOMContentLoaded", function() {
    fetchTimetable();

    // Add event listeners to input fields to change border color based on input value
    const roomInput = document.getElementById('room');
    const descriptionInput = document.getElementById('description');

    roomInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            this.classList.add('has-text');
        } else {
            this.classList.remove('has-text');
        }
    });

    descriptionInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            this.classList.add('has-text');
        } else {
            this.classList.remove('has-text');
        }
    });
});
