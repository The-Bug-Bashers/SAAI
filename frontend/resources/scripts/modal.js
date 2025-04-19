// this code needs a div with the id and class modal and the stile "display: none" in the HTML of the current site
// inside this dev there should be a div with the id: "modalContent" and the class "box"
// Example code:
// <div style="display: none" id="modal" class="modal">
//     <div id="modalContent" class="box"><!--used to display info or error messages--></div>
// </div>

function displayNotification(reason) {
    modalContent.innerHTML = `
        <p id="message"><!--message gets inserted here--></p>
        <div id="buttonDiv" style="display: flex; justify-content: center;">
            <button id="closeButton" class="button">schließen</button>
        </div>
    `;
    document.body.classList.add('modal-open');
    document.getElementById("message").innerHTML = reason;
    modal.style.display = 'flex';

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

async function displayConfirmation(reason) {
    return new Promise((resolve) => {
        modalContent.innerHTML = `
            <p id="message"><!--message gets inserted here--></p>
            <div id="buttonDiv" style="display: flex; justify-content: space-around;">
                <button id="declineButton" class="button">Abbrechen</button>
                <button id="confirmButton" class="button">Ok</button>
            </div>
        `;
        document.body.classList.add('modal-open');
        document.getElementById("message").innerHTML = reason;
        modal.style.display = 'flex';

        document.getElementById("declineButton").addEventListener('click', function() {
            document.body.classList.remove('modal-open');
            modal.style.display = 'none';
            resolve(false);
        });

        document.getElementById("confirmButton").addEventListener('click', function() {
            document.body.classList.remove('modal-open');
            modal.style.display = 'none';
            resolve(true);
        });
    });
}

function displayError(error, errorDescription, sendLivetickermessage){
    console.error("Custom error: ", error, errorDescription)

    if (sendLivetickermessage) {
        const sanitizedErrorDescription = errorDescription.replace(/<br>/g, '');
        fetch(livetickerApiUrl + "?message=CRITICAL+WARNING!+An+Error+Occurred:%0ASite:+" + window.location.pathname + "%0AError+header:+" + encodeURIComponent(error) + "%0AError+description:+" + encodeURIComponent(sanitizedErrorDescription));
    }

    /* Error notification modal */
    modalContent.innerHTML = `
        <p id="errorMessage"><!--error messages get inserted here--></p>
        <div id="buttonDiv" style="display: flex; justify-content: center;">
            <button id="reloadButton" class="button">Neu laden</button>
        </div>
    `;
    document.body.classList.add('modal-open');
    modal.style.display = 'flex';
    constructInnerHtmlForErrorMessage(document.getElementById("errorMessage"), error, errorDescription);

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
