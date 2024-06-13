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
