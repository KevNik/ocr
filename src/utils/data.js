import dayjs from "dayjs";
import  utc from "dayjs/plugin/timezone.js"
import timezone from "dayjs/plugin/utc.js"
dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz('America/Campo_Grande')

export default dayjs