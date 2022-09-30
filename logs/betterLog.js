import dayjs from "dayjs"

export default function log(message, error = false) {
  const horario = dayjs().format('DD/MM/YYYY HH:mm:ss')
  if (error) {
    console.error(
      `ERRO ${horario} - ${message}`
    )
  } else {
    console.log(
      `${horario} - ${message}`
    )
  }
}