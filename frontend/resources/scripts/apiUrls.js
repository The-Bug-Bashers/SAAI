const saaiApiUrl = "https://saai.wayshare.de:9090/api"; // the current url of the saai api

const InventoryTrackingAPiUrl = saaiApiUrl + "/coolingpacks"
const signalmessageApiUrl = saaiApiUrl + "/signalmessage";
const livetickerApiUrl = signalmessageApiUrl + "/liveticker";
const usersApiUrl = saaiApiUrl + "/users";
const timetableApiUrl = saaiApiUrl + "/infoscreen";
const dayOffApiUrl = saaiApiUrl + "/dayOff";
const messageApiUrl = saaiApiUrl + "/message";
const alertApiUrl = saaiApiUrl + "/alerts";
const singleAlertApiUrl = alertApiUrl + "/single";
const acceptedUsersApiUrl = alertApiUrl + "/accepted-users";
const activeAlertsApiUrl = saaiApiUrl + "/alerts/active"
const dutyGroupsApiUrl = saaiApiUrl + "/dutygroups";
const notifyDutyUsersApiUrl = saaiApiUrl + "/notifyDutyUsers";
const generateTimetableForThisWeekApiUrl = saaiApiUrl + "/auto-generate";
const deleteAllTimetablesApiUrl = saaiApiUrl + "/deleteAllTimetables";
