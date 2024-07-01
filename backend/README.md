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
- Purpose: Displaying who is currently on duty (for example at the Scool entrance or on the alerting page)
- Caling: `GET /infoscreen`
- Receiving: All Timetable events that are or where Active at the current day orderd by statrting time, If individual TimetableEvents are currently active, If at minimum 1 TimeTableEvent is currently Active, When the next timetableEvent is going to be acive.
- Receiving: (all posybilityes)
  - "next_active": `"Not Today anymore", if No TimetableEvents are going to be active untill midnight`, `"Now", if at minimum 1 TimetableEvent is currently active` or  `"XXh, XXmmin", time to the next TimeTableEvent`
  - ``
- Eample:
  - request: `GET /infoscreen`
  - response:
    `{
    "next_active": "2h, 16min",
    "events": [
        {
            "start_time": "03:00",
            "is_active": false,
            "end_time": "04:00",
            "responsible_users": [
                "TestSanni1"
            ]
        },
        {
            "start_time": "07:00",
            "is_active": false,
            "end_time": "08:00",
            "responsible_users": [
                "TestSanni2",
                "Admin 2"
            ]
        }
    ]
}`
