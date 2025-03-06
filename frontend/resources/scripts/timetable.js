// this code needs a div with the id: "timetableContainer" and with the classes: "timetableContainer" and "box" in the HTML of the current site
// Example code:
// <div id="timetableDiv" class="timetable box" style="display: none">
// 
// </div>

function fetchAndDisplayTimetable(timetableDivElement, shouldContinueIfNoEvents) {
    timetableDivElement.innerHTML = `
        <h1>Dienstplan</h1>
        <div id="timetableContainer">
            <!-- Timetable content will be added here -->
        </div>
    `;

    const timetableContainer = timetableDivElement.querySelector('#timetableContainer');

    return fetch(timetableApiUrl)
        .then(response => {
            if (response.ok) return response.json();
            else throw new Error('Network response was not ok');
        })
        .then(response => {
            if (response.events.length === 0) {
                if (shouldContinueIfNoEvents) {
                    timetableContainer.innerHTML = `<p>Es gibt keine Einträge im heutigen Dienstplan</p>`;
                    timetableDivElement.style.display = 'block';
                } else {
                    displayError("Es können keine Alarme verschickt werden, da heute niemand im Dienstplan steht.", "Falls du glaubst dass das ein Fehler ist, ", false);
                }
            } else {
                displayTimetable(response.events, timetableContainer);
            }
            return response;
        })
        .catch(error => {
            displayError("Es gab ein Problem beim Laden des Dienstplans:", error, true);
        });
}

function displayTimetable(events, timetableContainer) {
    timetableContainer.innerHTML = '';

    events.forEach(event => {
        const timetableRow = document.createElement('div');
        timetableRow.classList.add('timetable-row');
        if (event.is_active) {
            timetableRow.classList.add('active-timetable');
        }

        timetableRow.innerHTML = `
            <div class="timetable-details">
                <div><strong>Start: </strong>${event.start_time}</div>
                <div><strong>Ende: </strong>${event.end_time}</div>
            </div>
            <div class="responsible-users"><strong>Im Dienst: </strong>${event.responsible_users.join(', ')}</div>
        `;
        timetableContainer.appendChild(timetableRow);
    });
    timetableContainer.parentElement.style.display = 'block';
}
