function displayNotification(reason) {
    modalContent.innerHTML = `
        <p id="message"><!--message gets inserted here--></p>
        <div id="buttonDiv" style="display: flex; justify-content: center;">
            <button id="closeButton" class="button">schließen</button>
        </div>
    `;
    document.body.classList.add('modal-open');
    modal.style.display = 'flex';
    document.getElementById("message").innerHTML = reason;

    document.getElementById("closeButton").addEventListener('click', function() {
        document.body.classList.remove('modal-open');
        modal.style.display = 'none';
    });
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            document.body.classList.remove('modal-open');
            modal.style.display = 'none';
        }
    });
}


function displayError(error, errorDescription){
    console.error(error, errorDescription)
    /* Error notification modal */
    modalContent.innerHTML = `
        <p id="errorMessage"><!--error message gets inserted here--></p>
        <div id="buttonDiv" style="display: flex; justify-content: center;">
            <button id="reloadButton" class="button">Neu laden</button>
        </div>
    `;
    document.body.classList.add('modal-open');
    modal.style.display = 'flex';
    constructInnerHtmlForErrorMessage(document.getElementById("errorMessage"), error, errorDescription + `<br>`);

    document.getElementById("reloadButton").addEventListener('click', function() {
        location.reload();
    });

    modal.style.display = 'flex';
}

function constructInnerHtmlForErrorMessage(element, errorDescription, whenToReportError) {
    if (whenToReportError) {
        element.innerHTML = `${errorDescription}<p style="font-size: 0.8em">${whenToReportError}melde uns dies bitte <a href="../issue-report" target="_blank" style="color: #45a1ff; text-decoration: underline;">hier</a>.</p>`;
    } else {
        element.innerHTML = errorDescription;
    }
    element.style.display = 'block';
}
