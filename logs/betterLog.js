import dayjs from "dayjs"

export default function log(message, error = false) {
  const horario = dayjs().format('DD/MM/YYYY HH:mm:ss')
  if (error && process.env.APP_LEVEL != 'production') {
    console.error(
      `ERRO ${horario} - ${message} ${error}`
    )
  } else {
    console.log(
      `${horario} - ${message}`
    )
  }
}