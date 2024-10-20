The API receives requests from the web-page and then uses the SaniAlarm API to complete further actions
# API endpoints:
 
  ## /infoscreen
- Purpose: Displaying who is currently on duty (for example at the School entrance or on the alerting page)
- Calling: `GET /infoscreen`
- Receiving: All Timetable events that are or where Active at the current day ordered by starting time, If individual TimetableEvents are currently active, If at minimum 1 TimeTableEvent is currently Active, When the next timetableEvent is going to be acive.
- Receiving: (all possibilities)
  - "next_active": `"Not Today anymore", if No TimetableEvents are going to be active untill midnight`, `"Now", if at minimum 1 TimetableEvent is currently active` or  `"XXh, XXmmin", time to the next TimeTableEvent`
  - "events": [ { "start_time": `"XX:XX", Starttime `, "is_active": `true, if furrently active ` or `false if currently not active`, "end_time": `"XX:XX", Endtime`, "responsible_users": `[ "User1", "User2", all users, that are going to get alerted if thsi Timetable-event is active ]` } ]

- Example:
  - request: `GET /infoscreen`
  - response:
    `{ "next_active": "2h, 16min", "events": [ { "start_time": "03:00", "is_active": false, "end_time": "04:00", "responsible_users": [ "TestSanni1" ] }, { "start_time": "07:00", "is_active": false,"end_time": "08:00", "responsible_users": [        "TestSanni2", "Admin 2" ] } ] }`


## /alerts
- Purpose: Sending alerts to paramedics wich are in the currently active timetable
- Calling: `POST /alerts`
  - Body: `{"room":"X","description":"X"}`
- Receiving: Status (successful or not) and alertID (to identify the current alert) 
- Example:
  - request: `POST /infoscreen`
    - Body: `{"room":"Bibilothek","description":"Nasenbluten"}`
  - response:
    `{
    "alert_id": "0ac5e35a-639c-4c4c-ba9c-b4a6c2d83b56",
    "status": "Alert sent successfully"
}`

### /alerts/accepted-users/{alert_id}
- Purpose: Returning users that accepted a specific alert
- Calling: `GET /alerts/accepted-users/{alert_id}`
- Receiving: users that accepted the provided alert 
- Example:
  - request: `GET /alerts/accepted-users/{alert_id}`
  - response:
    `[
    "Admin 2",
    "TestSanni1"
]`

### /alerts/single
- Purpose: Sending alerts single paramedics not to the ones in duty
- Calling: `POST /alerts/single`
  - Body: `{"room":"X", "description":"X", "users": ["x"]}`
- Receiving: Status (successful or not) and alertID (to identify the current alert) 
- Example:
  - request: `POST /alerts/single`
    - Body: `{}`
  - response:
    `{}`


## /users
- Purpose: Maintaining MySQL database, Displaying user data
- Calling: `POST /users`
  - Body: `{"password": "X"}`
- Receiving: List of users names, their experience level, Telephone number and uuid. 
- Example:
  - request: `POST /infoscreen`
    - Body: `{"password": "mySuperSecurePassword"}`
  - response:
    `[
    {
        "telephoneNumber": "Signal.002",
        "experience": "super-mega-hyper-boss",
        "uuid": "dd32c521-dd68-4fa4-bd1c-6959ec105a20",
        "username": "Admin 1"
    },
    {
        "telephoneNumber": "Signalname.06",
        "experience": "advanced",
        "uuid": "d7d80e52-b880-404d-9e4f-e12f01366043",
        "username": "Admin 2"
    }
]`

### /users/{username}/experience
- Purpose: modifying user experience
- Calling: `PUT /users/{username}/experience`
  - Body: `{"experience": "X","password": "X"}`
- Receiving: Status (successful or not) 
- Example:
  - request: `PUT /users/TestSani1/experience`
    - Body: `{"experience": "noob", "password": "mySuperSecurePassword"}`
  - response:
    `{
    "message": "User experience updated successfully"
    }`

 ### /users/{username}/telephoneNumber
- Purpose: modifying Telephone number of user
- Calling: `PUT /users/{username}/telephoneNumber`
  - Body: `{"telephoneNumber": "X", "password": "X"}`
- Receiving: Status (successful or not) 
- Example:
  - request: `PUT /users/TestSani1/telephoneNumber`
    - Body: `{"telephoneNumber": "+2359574353989", "password": "mySuperSecurePassword"}`
  - response:
    `{
    "message": "User telephone number updated successfully"
}`

## /notifyDutyUsers
- Purpose: Manually triggering the cron job sending message to every user which is going to be on duty today.
- Calling: `GET /notifyDutyUsers`
- Receiving: Status (successful or not)
- Example:
  - request: `GET /notifyDutyUsers`
  - response:
    `Notifications sent successfully`

## /signalmessage
- Purpose: sending Messages to users (for example the verification messages)
- Calling: `POST signalmessage`
  - Body: `{"telephoneNumber": "the signal-name of user (example: Example.64)", "message": "X", "password": "X"}`
- Receiving: Status (successful or not)
- Example:
  - request: `POST signalmessage`
    - Body: `{"telephoneNumber": "Example.64", "message": "Hello user, you will be on duty tomorrow", "password": "mySuperSecurePassword"}`
  - response:
    `{"message": "Signal message sent successfully"}`

### /signalmessage/liveticker
- Purpose: sending messages to the Admin Liveticker Signal-Group via an GET request without password.
- Calling: `GET /signalmessage/liveticker?message=X`
- Receiving: Status (successful or not) 
- Example:
  - request: `GET /signalmessage/liveticker?message=my_super_i,portant_message`
  - response: `{"message": "Signal message sent successfully"}`


## /dayOff
- Calling: `POST /dayOff`
  - Body: `{"username": "X", "verificationNumber": "X"}`
- Receiving: Status (successful or not) 
- Example:
  - request: `POST /dayOff`
     - Body: `{"username": "Admin 2", "verificationNumber": "29934"}`
  - response: `Success: Day off approved and timetable updated`
- - Verification number generation: `correctVerificationNumber = (username_length * 3975) + (day * 100 + month)`
 
## /coolingpacks
- Purpose: Monitoring the usage of Coolingpacks
- Info: The POST and DELETE requests require the admin password beacause ownly admins should be able to add ore delete Coolingpacks. The PUT and GET requests require an seperate Coolingpacks password wich is alsow set in `application.propertys`. 

### POST
- Purpose: Adding Coolingpacks
- Calling: `POST /coolingpacks`
  - Body: `{"name": "X", "password": "X"}`
- Receiving: Statatus of new Coolingpack 
- Example:
  - request: `POST /coolingpacks`
     - Body: `{"name": "Green big Coolingpack", "password": "theAdminPassword"}`
  - response: `{"id": 10, "name": "Green big Coolingpack", "borrowed": false, "givenBy": null, "borrowedBy": null, "borrowedDate": null}`
 
### DELETE
- Purpose: Deleting Coolingpacks
- Calling: `DELETE /coolingpacks/{id}?password=X`
- Receiving: No content if succesfull 
- Example:
  - request: `POST /coolingpacks/6?password=theAdminPassword`
  - response: `204 No Content`

### PUT
- Purpose: Modifying status of Coolingpacks
- Calling: `PUT /coolingpacks/{id}`
  - Body: `{"borrowed": bool, "givenBy": "x", "borrowedBy": "x", "password": "x"}`
- Receiving: new Status of Coolingpack 
- Example:
  - request: `POST /coolingpacks/9`
     - Body: `{"borrowed": true, "givenBy": "John", "borrowedBy": "Felix", "password": "theCoolingpacksPassword"}`
  - response: `{"id": 9, "name": "Black small Coolingpack", "borrowed": true, "givenBy": "John", "borrowedBy": "Felix", "borrowedDate": "2024-10-20"}`
 
  ### GET
- Purpose: Returning the state of every Coolingpack
- Calling: `GET /coolingpacks?password=theCoolingpacksPassword`
- Receiving: status of every coolingpack 
- Example:
  - request: `GET /coolingpacks?password=theCoolingpacksPassword`
  - response: `[
    {
        "id": 9,
        "name": "Black Small Coolingpack",
        "borrowed": true,
        "givenBy": "John",
        "borrowedBy": "Felix",
        "borrowedDate": "2024-10-20"
    },
    {
        "id": 10,
        "name": "Green big Coolingpack",
        "borrowed": false,
        "givenBy": null,
        "borrowedBy": null,
        "borrowedDate": null
    }
]`

# Live-Ticker
there is the possibility to set up a live ticker group which will receive messages everytime an interaction with the SAAI system is made

## Setup
To set up the Live-Ticker group install `signal-cli` on the server and link a device.

Next, go to the `application.propertyes` file and set the `signal-cli.address.token` to the signal. group code wich should be used.
- Example: `signal-cli.address.token=Iu4tp0Ze8EA7fhxxq6GVQ8FhEs6SiHU+a0WBL+bhPnA=`

## logging
these actions will trigger a message:

### Alarm gets send
If an alarm gets send via the alerting-site
- Message: New Alert in Room: x Description: x

### Backup is requested
If Backup is requested via the additional-alarm-site
- Message: Backup requested in Room: X Description: X

### user gets removed from timetable
If a user takes removed from the timetables of today via the day-off site
- Message: WARNING: User Admin 2 got removed from today's timetable.

### users got notified about duty
If users got reminded about having duty today, today's timetable gets sent into the group.
 - Message: Users were notified about today's timetable events: X: X:X - X:X, X:X - X:X; X: X:X - X:X, X:X - X:X;

### Alerting page is opened
If alerting-page is opened
 - Message: Alerting Page opened


### Admin panel successful login 
 if someone successfully logged into the Admin panel
 - Message: Successful login at Admin-Panel

### Admin panel wrong password 
 if someone tried to log into the admin-panel and provided the wrong password
 - Message: WARNING: Wrong password detected at Admin-Panel login with password: X
 
 ### New message was set
 if a new message was set using the admin panel
 - Message: New Message set: X stage: X

### Message cleared
if the message was cleared using the admin panel
if message in admin panel was cleared
- Message: Message cleared

### Experience level gets changed
 if the user experience level in admin panel was changed
 - Message: Experience level changed for X to X.

 ### Signal-Username was cleared
 if the Signal-username in the admin panel was cleared
 - Message: Signal-Username cleared for X.

### Signal-Username was set
 if the Signal-Username in the admin panel was set
- Message: Signal-Username set to X for X.

### Verification message is send
 if a Verification message is send from the  admin panel
 - Message: Verification message send to X.

 ### Deletion of all Timetables
 if all timetables were deleted
 - Message: WARNING: All timetables deleted.



# setup
some things need to get setup before the website and the API are ready to rumble

## mySQL
to set up mysql you first need to install in on the server

```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

then you can create a Database and User

in the application.properties, you can change the URL, Username and Password, they should be the same as oyu specify with the next command
```bash
sudo mysql -u root -p
```
now, once logged into the MySQL shell run the following commands:
```java
CREATE DATABASE your_database_name;
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON your_database_name.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
