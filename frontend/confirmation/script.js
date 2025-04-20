document.addEventListener("DOMContentLoaded", function() {
    const username = new URLSearchParams(window.location.search).get("username");
    if (username === null) {
        displayError("Der benutzername konnte nicht gefunden werden. Öffne diese seite bitte ausschließlich über den dir per Signal zugesendeten link", "Username parameter not valid: " + username + "<br>Falls dieser Fehler bestehen bleibt, ", true);
        return;
    }
    document.getElementById("usernameSpan").textContent = username;
    document.getElementById("sendConfirmationButton").addEventListener("click", function() {
        fetch(`${livetickerApiUrl}?message=Confirmation+Send:%0AUser:+${username}`)
        .then(response => {
            if (!response.ok) {
                displayError("Es gab ein Problem beim versenden der Bestätigung.", "Error sending confirmation: " + response.status, true);
                return;
            }
            displayNotification("Die Bestätigung wurde <b>erfolgreich</b> versendet. du kannst die Seite jetzt schließen.");
        }).catch(error => {displayError("Es gab ein Problem beim versenden der Bestätigung.", "Error sending confirmation: " + error, true);});
    })
})