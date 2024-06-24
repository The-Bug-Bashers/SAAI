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
  - response:  `{"sum":42}`
 
  ## /infoscreen
- Purpose: Displaying who is currently on duty (for example at the Scool entrance)
- Caling: `GET /infoscreen`
- Receiving: All Timetable events that are or where Active at the current day orderd by statrting time, If individual TimetableEvents are currently active, If at minimum 1 TimeTableEvent is currently Active, when the next timetableEvent is going to be acive .
- Receiving all posybilityes
  - "next_active": `"Not Today anymore", if None TimetableEvents are going to be active untill midnight`, `"Now", if at minimum 1 TimetableEvent is currently active` or  `"XXh, XXmmin", time to next TimeTableEvent`
  - ``
- Eample:
  - request: `GET /infoscreen`
  - response:
    `{"start_time": "08:00", "is_active": false, "end_time": "15:45", "responsible_users": ["Test Admin1", "Test Sani1", "Test Sani2"]},
    {"start_time": "19:16", "is_active": false, "end_time": "19:21", "responsible_users": ["Test Admin1", "Test Sani3" ]}]`
