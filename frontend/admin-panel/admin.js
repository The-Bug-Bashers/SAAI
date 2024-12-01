document.addEventListener("DOMContentLoaded", function () {
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('adminPassword');
    const submitButton = document.getElementById('submitPasswordButton');
    const passwordErrorMessage = document.getElementById('passwordErrorMessage');
    const adminContent = document.getElementById('adminContent');
    const messageContent = document.getElementById('messageContent');
    let storedPassword = '';

    // Initial password modal show
    passwordModal.style.display = 'flex';

    passwordInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            submitPassword();
        }
    });

    submitButton.addEventListener('click', submitPassword);

    passwordModal.addEventListener('click', function (event) {
        if (event.target === passwordModal) {
            event.stopPropagation();
        }
    });

    function fetchUsers() {
        const requestBody = { password: storedPassword };

        return fetch('https://saai.wayshare.de:9090/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching users:', error);
                alert('There was an error fetching users. Please try again later.');
            });
    }

    function loadDutyGroups() {
        fetch(`https://saai.wayshare.de:9090/api/dutygroups?password=${storedPassword}`)
            .then(response => response.json())
            .then(data => {
                const dutyGroupsContainer = document.getElementById('dutyGroupsContainer');
                dutyGroupsContainer.innerHTML = ''; // Clear existing content

                data.forEach(group => {
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'user-row';

                    groupDiv.innerHTML = `
                    Members: <strong>${group.userNames.join(', ')}</strong><br>
                    Days Since Last Duty: <strong>${group.daysSinceLastDuty}</strong><br>
                    Duty Days: <strong>${group.dutyDays.join(', ')}</strong><br>
                    Start Time: <strong>${group.dutyStart}</strong><br>
                    End Time:<strong>${group.dutyEnd}</strong><br>
                    Friday End Time:<strong>${group.fridayDutyEnd || 'Default End Time'}</strong><br>
                `;

                    // Add delete button for each duty group
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.addEventListener('click', function () {
                        const confirmDelete = confirm(`Are you sure you want to delete Duty Group ${group.id}?`);
                        if (confirmDelete) {
                            deleteDutyGroup(group.id);
                            fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=WARNING:_Duty_Group_deleted`);
                        }
                    });

                    groupDiv.appendChild(deleteButton);
                    dutyGroupsContainer.appendChild(groupDiv);
                });
            })
            .catch(error => {
                console.error('Error fetching duty groups:', error);
                alert('There was an error loading duty groups. Please try again later.');
            });
    }


    function deleteDutyGroup(id) {
        fetch(`https://saai.wayshare.de:9090/api/dutygroups/${id}?password=${storedPassword}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.status === 204) {
                    alert(`Duty group ${id} deleted successfully.`);
                    loadDutyGroups(); // Refresh the list
                } else {
                    alert('Failed to delete the duty group.');
                }
            })
            .catch(error => {
                console.error('Error deleting duty group:', error);
                alert('There was an error deleting the duty group. Please try again.');
            });
    }

    function submitPassword() {
        const enteredPassword = passwordInput.value;
        const requestBody = { password: enteredPassword };

        fetch('https://saai.wayshare.de:9090/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())
            .then(data => {
                if (data[0]?.error) {
                    passwordErrorMessage.style.display = 'block';
                    passwordErrorMessage.textContent = 'Incorrect password or password not entered. Please try again.';
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=WARNING:_Wrong_password_detected_at_Admin-Pannel_login_with_password:_${encodeURIComponent(enteredPassword)}`)
                } else {
                    storedPassword = enteredPassword;
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Succesfull_login_at_Admin-Panel`);
                    passwordModal.style.display = 'none';
                    adminContent.style.display = 'block';
                    document.getElementById('dangerZone').style.display = 'block';
                    loadMessageBox();
                    displayUsers(data);
                    loadCoolingPacks();
                    loadDutyGroups();
                }
            })
            .catch(error => {
                console.error('Error during the API request:', error);
                passwordErrorMessage.style.display = 'block';
                passwordErrorMessage.textContent = 'There was an error with the API request. Please try again later.';
            });
    }

    // Add Duty Group Event Listeners
    document.getElementById('addDutyGroupButton').addEventListener('click', function () {
        const confirmAdd = confirm("Are you sure you want to add a new Duty Group?");
        if (confirmAdd) {
            document.getElementById('addDutyGroupModal').style.display = 'flex';

            // Populate user options if not already populated
            const userSelect = document.getElementById('userSelect');
            userSelect.innerHTML = ''; // Clear existing options
            fetchUsers().then(users => {
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.username;
                    option.text = user.username;
                    userSelect.appendChild(option);
                });
            });
        }
    });

    document.getElementById('cancelAddDutyGroupButton').addEventListener('click', function () {
        document.getElementById('addDutyGroupModal').style.display = 'none';
    });

    document.getElementById('confirmAddDutyGroupButton').addEventListener('click', function () {
        const selectedUsers = Array.from(document.getElementById('userSelect').selectedOptions)
            .map(option => option.value);
        const selectedDays = Array.from(document.getElementById('dutyDaysSelect').querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        const dutyStart = document.getElementById('dutyStartTime').value;
        const dutyEnd = document.getElementById('dutyEndTime').value;
        const fridayDutyEnd = document.getElementById('fridayDutyEndTime').value || null;

        if (selectedUsers.length === 0 || selectedDays.length === 0) {
            alert('Please select at least one user and one duty day.');
            return;
        }

        if (!dutyStart || !dutyEnd) {
            alert('Please set both start and end times for the duty.');
            return;
        }

        const requestBody = {
            userNames: selectedUsers,
            daysSinceLastDuty: 0,
            dutyDays: selectedDays,
            dutyStart,
            dutyEnd,
            fridayDutyEnd,
            password: storedPassword
        };

        fetch('https://saai.wayshare.de:9090/api/dutygroups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())
            .then(data => {
                fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Duty_Group_added:${encodeURIComponent('\n')}Users:_${selectedUsers.join(', ')}${encodeURIComponent('\n')}Possible_Duty_Days:_${selectedDays.join(', ')}${encodeURIComponent('\n')}Start_time:_${dutyStart}${encodeURIComponent('\n')}End_time:_${dutyEnd}${encodeURIComponent('\n')}End_time_if_friday:_${fridayDutyEnd}${encodeURIComponent('\n')}`)
                alert('Duty group added successfully.');
                document.getElementById('addDutyGroupModal').style.display = 'none';
                loadDutyGroups(); // Refresh duty groups
            })
            .catch(error => {
                console.error('Error adding duty group:', error);
                alert('There was an error adding the duty group. Please try again.');
            });
    });



    function loadMessageBox() {
        fetch('https://saai.wayshare.de:9090/api/message')
            .then(response => response.json())
            .then(data => {
                const { stage, content } = data;
                messageContent.innerHTML = `<p>Current Message: ${content}</p>`;
                if (stage === 0) {
                    displaySetMessageForm();
                } else {
                    displayClearMessageButton(stage);
                }
            })
            .catch(error => {
                console.error('Error fetching message:', error);
                messageContent.innerHTML = `<p>Failed to load message. Please try again later.</p>`;
            });
    }

    function displaySetMessageForm() {
        messageContent.innerHTML += `
            <input type="text" id="newMessageContent" placeholder="Enter new message">
            <button id="setMessageButton">Set New Message</button>
        `;

        document.getElementById('setMessageButton').addEventListener('click', function () {
            const newMessage = document.getElementById('newMessageContent').value;
            if (!newMessage) {
                alert("Please enter a message.");
                return;
            }
            const confirmSet = confirm("Do you want to set this message?");
            if (confirmSet) {
                const stage = prompt("Set the message state:\n1: Notification\n2: Warning\n3: Issue", "1");
                if (stage >= 1 && stage <= 3) {
                    updateMessage(newMessage, parseInt(stage));
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=New_Message_set:_${encodeURIComponent(newMessage)}_with_stage:_${encodeURIComponent(stage)}`)
                } else {
                    alert("Invalid stage selected.");
                }
            }
        });
    }

    function displayClearMessageButton(stage) {
        const stageText = ["", "Notification", "Warning", "Issue"][stage];
        messageContent.innerHTML += `
            <p>Message Stage: ${stageText}</p>
            <button id="clearMessageButton">Clear Message</button>
        `;

        document.getElementById('clearMessageButton').addEventListener('click', function () {
            const confirmClear = confirm("Do you really want to clear the message?");
            if (confirmClear) {
                updateMessage("", 0);
                fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Message_cleared`)
            }
        });
    }

    function updateMessage(newContent, stage) {
        const requestBody = {
            password: storedPassword,
            content: newContent,
            stage: stage
        };

        fetch('https://saai.wayshare.de:9090/api/message', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => {
                if (response.ok) {
                    alert("Message updated successfully.");
                    loadMessageBox();
                } else {
                    alert("Failed to update message.");
                }
            })
            .catch(error => {
                console.error('Error updating message:', error);
                alert('There was an error updating the message. Please try again.');
            });
    }



    function displayUsers(data) {
        const userBox = document.createElement('div');
        userBox.className = 'user-box';
        userBox.innerHTML = `<h1>User Administration</h1><hr class="big-separator">`;

        const usersContainer = document.createElement('section');
        usersContainer.id = 'usersContainer';

        const experienceLevels = ['freshman', 'advanced', 'super-mega-hyper-boss'];

        data.forEach(user => {
            const userRow = document.createElement('div');
            userRow.className = 'user-row';

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'user-details';
            detailsDiv.innerHTML = `<strong>${user.username}</strong><br>`;
            userRow.appendChild(detailsDiv);

            const experienceDiv = document.createElement('div');
            experienceDiv.className = 'user-experience';
            const experienceLabel = document.createElement('span');
            experienceLabel.textContent = 'Experience level: ';
            experienceDiv.appendChild(experienceLabel);

            const experienceSelect = document.createElement('select');
            experienceLevels.forEach(level => {
                const option = document.createElement('option');
                option.value = level;
                option.text = level;
                if (user.experience === level) {
                    option.selected = true;
                }
                experienceSelect.appendChild(option);
            });

            experienceSelect.addEventListener('change', function () {
                const newExperience = experienceSelect.value;
                const confirmation = confirm(`Do you really want to change the experience level for ${user.username} to ${newExperience}?`);
                if (confirmation) {
                    updateExperience(user.username, newExperience);
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Experience_level_changed_for_${user.username}_to_${newExperience}.`)
                } else {
                    experienceSelect.value = user.experience;
                }
            });

            experienceDiv.appendChild(experienceSelect);
            userRow.appendChild(experienceDiv);

            const telephoneDiv = document.createElement('div');
            telephoneDiv.className = 'user-telephone';

            if (user.telephoneNumber === 'none' || !user.telephoneNumber) {
                const telephoneInput = document.createElement('input');
                telephoneInput.type = 'text';
                telephoneInput.placeholder = 'Example.64';
                telephoneInput.className = 'user-experience';

                const setTelephoneButton = document.createElement('button');
                setTelephoneButton.textContent = 'Set Signal-Username';

                setTelephoneButton.addEventListener('click', function () {
                    const newNumber = telephoneInput.value;
                    const confirmation = confirm(`Do you really want to set the Signal-Username to ${newNumber} for ${user.username}?`);
                    if (confirmation) {
                        updateTelephoneNumber(user.username, newNumber);
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Signal-Username_set_to_${newNumber}_for_${user.username}.`)
                    }
                });

                telephoneDiv.appendChild(telephoneInput);
                telephoneDiv.appendChild(setTelephoneButton);
            } else {
                telephoneDiv.innerHTML = `Signal-Username: ${user.telephoneNumber} `;

                const clearTelephoneButton = document.createElement('button');
                clearTelephoneButton.textContent = 'Clear Signal-Username';

                clearTelephoneButton.addEventListener('click', function () {
                    const confirmation = confirm(`Do you really want to clear the Signal-Username for ${user.username}?`);
                    if (confirmation) {
                        updateTelephoneNumber(user.username, 'none');
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Signal-Username_cleared_for_${user.username}.`)
                    }
                });

                telephoneDiv.appendChild(clearTelephoneButton);

                // Add "Send Verification Message" button
                const sendVerificationButton = document.createElement('button');
                sendVerificationButton.textContent = 'Send Verification Message';

                sendVerificationButton.addEventListener('click', function () {
                    const confirmation = confirm(`Do you really want to send a verification message to ${user.telephoneNumber} for ${user.username}?`);
                    if (confirmation) {
                        sendVerificationMessage(user.telephoneNumber, user.username);
                        fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Verification_message_send_to_${user.username}.`)
                    }
                });

                telephoneDiv.appendChild(sendVerificationButton);
            }

            userRow.appendChild(telephoneDiv);
            usersContainer.appendChild(userRow);
        });

        userBox.appendChild(usersContainer);
        adminContent.appendChild(userBox);
    }

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

    function updateTelephoneNumber(username, newTelephoneNumber) {
        const requestBody = {
            telephoneNumber: newTelephoneNumber,
            password: storedPassword
        };

        fetch(`https://saai.wayshare.de:9090/api/users/${username}/telephoneNumber`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => {
                if (response.ok) {
                    alert(`Signal-Username for ${username} updated successfully.`);
                    fetchUsers();
                } else {
                    alert(`Failed to update Signal-Username for ${username}.`);
                }
            })
            .catch(error => {
                console.error('Error updating Signal-Username:', error);
                alert('There was an error updating the Signal-Username. Please try again.');
            });
    }

    function sendVerificationMessage(telephoneNumber, username) {
        let usernameWithoutSpaces = username.replace(/\s+/g, '');
        const requestBody = {
            telephoneNumber: telephoneNumber,
            message: `Hallo ${username}, ich bin VaGABfS, ein Bot, den Justus programmiert hat, um Aufgaben im Bereich Signal zu automatisieren.\nBitte nimm die Unterhaltungsanfrage an, damit ich dich in Zukunft mit Nachrichten, die den Schulsanitätsdienst betreffen, erreichen kann.\n\nIch werde dir jeden Tag, an dem du Dienst hast, eine Nachricht senden, um dich daran zu erinnern, ein Gerät mit der SaniAlarm-App bei dir zu tragen.\nDiese Nachricht wird dann auch einen Link enthalten, auf den du klicken kannst, wenn du an diesem Tag nicht in der Schule bist. Dann wirst du automatisch aus dem Dienstplan für diesen Tag entfernt.\n\nWenn du diese Nachricht empfangen hast, klicke bitte auf den folgenden Link. Wundere dich nicht, wenn du nur eine schwarze Seite mit "message": "Signal message sent successfully" siehst, dies ist gewollt und der Link informiert die Administratoren, dass du diese Nachricht erhalten hast.\nhttps://saai.wayshare.de:9090/api/signalmessage/liveticker?message=User${usernameWithoutSpaces}confirmedTheConfirmationMessage\n\nAh, und noch eine letzte Sache, bitte schreibe diesem Signal-Account keine Nachrichten, da sie nicht verarbeitet werden, und so nur den Bot verlangsamen.\nWenn es Probleme gibt, gehe bitte in der Schule zu Justus oder Jannik, sie werden dir hoffentlich helfen können.`,
            password: storedPassword
        };

        fetch('https://saai.wayshare.de:9090/api/signalmessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => {
                if (response.ok) {
                    alert('Verification message sent successfully.');
                } else {
                    alert('Failed to send verification message.');
                }
            })
            .catch(error => {
                console.error('Error sending verification message:', error);
                alert('There was an error sending the verification message. Please try again.');
            });
    }


    deleteTimetablesButton.addEventListener('click', function () { // New event listener
        const firstConfirmation = confirm("Are you sure you want to delete all timetables?");
        if (firstConfirmation) {
            const secondConfirmation = confirm("Are you really sure you want to continue?");
            if (secondConfirmation) {
                const requestBody = {
                    password: storedPassword // Use the stored password
                };

                fetch('https://saai.wayshare.de:9090/api/deleteAllTimetables', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                })
                    .then(response => {
                        if (response.ok) {
                            alert('All timetables have been successfully deleted.');
                            fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=WARNING:_All_timetables_deleated.`)
                        } else {
                            alert('Failed to delete timetables.');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting timetables:', error);
                        alert('There was an error deleting the timetables.');
                    });

            }
        }
    });


    const assignDutyGroupsButton = document.getElementById('assignDutyGroupsButton');
    assignDutyGroupsButton.addEventListener('click', function () {
        const firstConfirmation = confirm("Are you sure you want to assign duty groups to the timetable?");
        if (firstConfirmation) {
            const secondConfirmation = confirm("This action will assign duty groups to the timetable. Are you really sure?");
            if (secondConfirmation) {
                const requestBody = {
                    password: storedPassword // Use the stored password
                };

                fetch('https://saai.wayshare.de:9090/api/timetables/auto-generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                })
                    .then(response => {
                        if (response.ok) {
                            alert('Duty groups have been successfully assigned to the timetable.');
                            fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Duty_groups_assigned_to_timetable.`);
                        } else {
                            alert('Failed to assign duty groups to the timetable.');
                        }
                    })
                    .catch(error => {
                        console.error('Error assigning duty groups:', error);
                        alert('There was an error assigning duty groups to the timetable. Please try again.');
                    });
            }
        }
    });


    // Function to load all cooling packs
    function loadCoolingPacks() {
        fetch(`https://saai.wayshare.de:9090/api/coolingpacks?password=${storedPassword}`)
            .then(response => response.json())
            .then(data => {
                const coolingPacksContainer = document.getElementById('coolingPacksContainer');
                coolingPacksContainer.innerHTML = ''; // Clear existing content
                data.forEach(pack => {
                    const packDiv = document.createElement('div');
                    packDiv.className = 'cooling-pack-item';
                    packDiv.textContent = `${pack.name} (Borrowed: ${pack.borrowed ? 'Yes' : 'No'})`;

                    // Add delete button for each cooling pack
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.addEventListener('click', function () {
                        const confirmDelete = confirm(`Are you sure you want to delete "${pack.name}"?`);
                        if (confirmDelete) {
                            deleteCoolingPack(pack.id);
                        }
                    });
                    packDiv.appendChild(deleteButton);
                    coolingPacksContainer.appendChild(packDiv);
                });
            })
            .catch(error => {
                console.error('Error fetching items data:', error);
                alert('There was an error loading item-tracking data. Please try again later.');
            });
    }

// Function to add a new cooling pack
    function addCoolingPack(name) {
        const requestBody = {
            name: name,
            password: storedPassword
        };

        fetch('https://saai.wayshare.de:9090/api/coolingpacks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())
            .then(data => {
                alert(`Item "${data.name}" added successfully.`);
                fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=Item:_"${data.name}"_added_successfully`)
                loadCoolingPacks();
            })
            .catch(error => {
                console.error('Error adding Item:', error);
                alert('There was an error adding the Item. Please try again.');
            });
    }

// Function to delete a cooling pack by its ID
    function deleteCoolingPack(id) {
        fetch(`https://saai.wayshare.de:9090/api/coolingpacks/${id}?password=${storedPassword}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    alert('Item deleted successfully.');
                    loadCoolingPacks(); // Refresh the list
                    fetch(`https://saai.wayshare.de:9090/api/signalmessage/liveticker?message=WARNING:_Item_Deleted`)
                } else {
                    alert('Failed to delete the Item.');
                }
            })
            .catch(error => {
                console.error('Error deleting cooling pack:', error);
                alert('There was an error deleting the Item. Please try again.');
            });
    }

    document.getElementById('addCoolingPackButton').addEventListener('click', function () {
        const newCoolingPackName = document.getElementById('newCoolingPackName').value.trim();
        if (!newCoolingPackName) {
            alert('Please enter a name for the new Item.');
            return;
        }

        const confirmAdd = confirm(`Are you sure you want to add a new Item named "${newCoolingPackName}"?`);
        if (confirmAdd) {
            addCoolingPack(newCoolingPackName);
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const notifyButton = document.getElementById('notifyDutyUsersButton');
    const deleteTimetablesButton = document.getElementById('deleteTimetablesButton'); // New button

    notifyButton.addEventListener('click', function () {
        const firstConfirmation = confirm("Are you sure you want to manually trigger notifying users on duty today?");
        if (firstConfirmation) {
            const secondConfirmation = confirm("Are you really sure you want to continue?");
            if (secondConfirmation) {
                fetch('https://saai.wayshare.de:9090/api/notifyDutyUsers', {
                    method: 'GET'
                })
                    .then(response => {
                        if (response.ok) {
                            alert('Users on duty today have been successfully notified.');
                        } else {
                            alert('Failed to notify users on duty.');
                        }
                    })
                    .catch(error => {
                        console.error('Error notifying duty users:', error);
                        alert('There was an error triggering the notification.');
                    });
            }
        }
    });
});



