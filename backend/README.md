The API receives requests from the web-page and then uses the SaniAlarm API to completate further actions
# API endpoints:

## /sum
- Purpose: Testing if the API is currently working.
- Caling: `POST /sum`
  - Body: `{"num1":X, "num2":X}`
- Receiving: addition of values num1 and num2
- Eample:
  - request: `POST /sum`
    - Body: `{"num1":23, "num2":19}`
  - response:  
 
  ## /infoscreen
- Purpose: Displaying who is currently on duty (for example at the Scool entrance or on the alerting page)
- Caling: `GET /infoscreen`
- Receiving: All Timetable events that are or where Active at the current day orderd by statrting time, If individual TimetableEvents are currently active, If at minimum 1 TimeTableEvent is currently Active, When the next timetableEvent is going to be acive.
- Receiving: (all posybilityes)
  - "next_active": `"Not Today anymore", if No TimetableEvents are going to be active untill midnight`, `"Now", if at minimum 1 TimetableEvent is currently active` or  `"XXh, XXmmin", time to the next TimeTableEvent`
  - "events": [ { "start_time": `"XX:XX", Starttime `, "is_active": `true, if furrently active ` or `false if currently not active`, "end_time": `"XX:XX", Endtime`, "responsible_users": `[ "User1", "User2", all users, that are going to get alerted if thsi Timetable-event is active ]` } ]

- Eample:
  - request: `GET /infoscreen`
  - response:
    `{ "next_active": "2h, 16min", "events": [ { "start_time": "03:00", "is_active": false, "end_time": "04:00", "responsible_users": [ "TestSanni1" ] }, { "start_time": "07:00", "is_active": false,"end_time": "08:00", "responsible_users": [        "TestSanni2", "Admin 2" ] } ] }`


## /alerts
- Purpose: Sending alerts to paramedics wich are in the currently active timetable
- Caling: `POST /alerts`
  - Body: `{"room":"X","description":"X"}`
- Receiving: Status (successfull or not) and alertID (to identify the current alert) 
- Eample:
  - request: `POST /infoscreen`
    - Body: `{"room":"Bibilothek","description":"Nasenbluten"}`
  - response:
    `{
    "alert_id": "0ac5e35a-639c-4c4c-ba9c-b4a6c2d83b56",
    "status": "Alert sent successfully"
}`

### /alerts/accepted-users/{alert_id}
- Purpose: Returning users that accepted an speccific alert
- Caling: `GET /alerts/accepted-users/{alert_id}`
- Receiving: users that accepted the provided alert 
- Eample:
  - request: `GET /alerts/accepted-users/{alert_id}`
  - response:
    `[
    "Admin 2",
    "TestSanni1"
]`

### /alerts/single
- Purpose: Sending alerts single paramedics not to the ones in duty
- Caling: `POST /alerts/single`
  - Body: `{"room":"X", "description":"X", "users": ["x"]}`
- Receiving: Status (successfull or not) and alertID (to identify the current alert) 
- Eample:
  - request: `POST /alerts/single`
    - Body: `{}`
  - response:
    `{}`


## /users
- Purpose: Meintaining MySQL database, Displaying user data
- Caling: `POST /users`
  - Body: `{"password": "X"}`
- Receiving: List of users names, theyr experience level, Telephone number and uuid. 
- Eample:
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
- Caling: `PUT /users/{username}/experience`
  - Body: `{"experience": "X","password": "X"}`
- Receiving: Status (succesfull or not) 
- Eample:
  - request: `PUT /users/TestSani1/experience`
    - Body: `{"experience": "noob", "password": "mySuperSecurePassword"}`
  - response:
    `{
    "message": "User experience updated successfully"
    }`

 ### /users/{username}/telephoneNumber
- Purpose: modifying Telephonenumber of user
- Caling: `PUT /users/{username}/telephoneNumber`
  - Body: `{"telephoneNumber": "X", "password": "X"}`
- Receiving: Status (succesfull or not) 
- Eample:
  - request: `PUT /users/TestSani1/telephoneNumber`
    - Body: `{"telephoneNumber": "+2359574353989", "password": "mySuperSecurePassword"}`
  - response:
    `{
    "message": "User telephone number updated successfully"
}`

## /notifyDutyUsers
- Purpose: Mannualy trigegring teh cron job sending message to every user wich is going to be on duty today.
- Caling: `GET /notifyDutyUsers`
- Receiving: Status (succesfull or not)
- Eample:
  - request: `GET /notifyDutyUsers`
  - response:
    `Notifications sent successfully`

## /signalmessage
- Purpose: sending Messages to users (for example the verification messages)
- Caling: `POST signalmessage`
  - Body: `{"telephoneNumber": "the signal-name of user (example: Example.64)", "message": "X", "password": "X"}`
- Receiving: Status (succesfull or not)
- Eample:
  - request: `POST signalmessage`
    - Body: `{"telephoneNumber": "Example.64", "message": "Hello user, you will be on duty tomorrow", "password": "mySuperSecurePassword"}`
  - response:
    `{"message": "Signal message sent successfully"}`

### /signalmessage/liveticker
- Purpose: sending messages to the Admin Liveticker Signal-Group via an GET request without password.
- Caling: `GET /signalmessage/liveticker?message=X`
- Receiving: Status (succesfull or not) 
- Eample:
  - request: `GET /signalmessage/liveticker?message=my_super_i,portant_message`
  - response: `{"message": "Signal message sent successfully"}`


## /dayOff
- Purpose: Remooving Parametics from the timetable if they are not at scool.
- Caling: `POST /dayOff`
  - Body: `{"username": "X", "verificationNumber": "X"}`
- Receiving: Status (succesfull or not) 
- Eample:
  - request: `POST /dayOff`
     - Body: `{"username": "Admin 2", "verificationNumber": "29934"}`
  - response: `Success: Day off approved and timetable updated`
- - Verificarion number generation: `correctVerificationNumber = (username_length * 3975) + (day * 100 + month)`

# Live-Ticker
there is the possybility to setup an liveticker group wich will receive message everytime an interaction with the SAAI systhem is made

## Setup
To setup the Live-Ticker group install `signal-cli` on the server and link an device.

Next, go to the `application.propertyes` file and set the `signal-cli.address.token` to the signal. group code wich should be used.
- Example: `signal-cli.address.token=Iu4tp0Ze8EA7fhxxq6GVQ8FhEs6SiHU+a0WBL+bhPnA=`

## logging
these actions will trigger an message:

### Alarm gets send
If an alarm gets send via the alerting-site
- Message: New Alert in Room: x Description: x

### Backup is requested message
If Backup is requested via the additional-alarm-site
- Message: Backup requestet in Room: X Description: X

### user gets remooved from the timetable
if an user takes removved frome the timetables of today via the day-off site
- Message: (not implemented jet)

### users got notifyed aout having duty
 if users got reminded about having duty todayteh timetable of today gets send into the group
 - Message: Users were notified about today's timetable events: X: X:X - X:X, X:X - X:X; X: X:X - X:X, X:X - X:X;

### Alerting page is opened
 if alerting-page is poened
 - Message: Alerting Page opened


### Admin panel succesfull login 
 if someone succesfully logged into the Admin panel
 - Message: Succesfull login at Admin-Panel

### Admin panel wrong password 
 if someone tryed to log into the admin-panel and provided the wrong password
 - Message: WARNING: Wrong password detected at Admin-Pannel login with password: X
 
 ### New message was set
 if a new message was set using the admin panel
 - Message: New Message set: X stage: X

### Message cleared
if the message was cleared using the admon panel
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
 if an Verification message is send from the  admin panel
 - Message: Verification message send to X.


 ### Deletion of all Timetables
 if all timetables where deleated
 - Message: WARNING: All timetables deleated.



# setup
some things need to get setup before the website and the API are ready to rumble

## mySQL
to setup mysql you first need to install in on the server

```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

then you can create an Database and User

in the application.proppertyes, you can change the URL, Username and Password, they should be the same as oyu specify with the next command
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
