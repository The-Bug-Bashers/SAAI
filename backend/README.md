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
- Receiving: all Timetable events that are or where Active at the current day orderd by statrting time.
- Eample:
  - request: `GET /infoscreen`
  - response:  `[
    {
        "start_time": "06:20",
        "end_time": "07:00",
        "responsible_users": [
            "Jakob Ricken",
            "Erik Popper"
        ]
    },
    {
        "start_time": "07:00",
        "end_time": "14:45",
        "responsible_users": [
            "Elina Wink",
            "Simon Hanke",
            "Levin Eisenbiegler"
        ]
    },
    {
        "start_time": "14:45",
        "end_time": "16:00",
        "responsible_users": [
            "Arvid Eisenbiegler",
            "Jonathan Kranz",
            "Jannik Händel"
        ]
    }
]`

