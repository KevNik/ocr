import dayjs from "./data.js";

export function getLegendaDaCaptura(placa) {
    return {
        superior: `Placa: ${placa.plate} Endereço: ${process.env.ENDERECO}`,
        intermediario: `DATA: ${dayjs(placa.date_time).format('DD/MM/YYYY')} HORA: ${dayjs(placa.date_time).add(4, 'hour').format('HH:mm:ss:SSS')}`,
        inferior: `Sentido: ${process.env.SENTIDO}  Município: ${process.env.MUNICIPIO} UF: ${process.env.UF}`
    }
}