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
- Purpose: Sending alerts to paramedics
- Caling: `POST /infoscreen`
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

## /users
- Purpose: Meintaining MySQL database, Displaying user data
- Caling: `POST /users`
  - Body: `{"password": "X"}`
- Receiving: List of users names and theyr experience level 
- Eample:
  - request: `POST /infoscreen`
    - Body: `{"password": "mySuperSecurePassword"}`
  - response:
    `{
    "Admin 2": "noob",
    "Admin 1": "new",
    "Test sanni2": "new",
    "TestSani1": "advanced"
    }`

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
