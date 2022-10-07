import getPlacasCapturadas from "./placasCapturadas.js";
import getUltimoId from "./ultimoIdEnviado.js";
import getFotoComLegenda from "./fotoComLegenda.js";
import dayjs from "./data.js";
import placaFoiTotalmenteReconhecida from "./placaFoiTotalmenteReconhecida.js";

async function getFoto(placa, semFoto) {
    return !semFoto ? await getFotoComLegenda(placa) : null;
}

export default async function montarDadosParaEnvio(semFoto = false) {
    const placas = await getPlacasCapturadas(semFoto);
    const ultimoId = await getUltimoId(!semFoto);
    return await placas.map(async placa => {
        let foto = await getFoto(placa, semFoto);
		
        if (semFoto) {
            return {
				id: placa.id,
                cEQP: process.env.CODIGO_EQUIPAMENTO,
                dhPass: dayjs(placa.time).format('DD-MM-YYYYTHH:mm:ss') + '-0400',
                parcialmente_reconhecida: placaFoiTotalmenteReconhecida(placa),
                placa: placa.plate,
                sentido: process.env.SENTIDO,
            }
        }

        return {
            id: placa.id, // img
            ultimo_id: ultimoId,
            cEQP: process.env.CODIGO_EQUIPAMENTO, // ambos
            dhPass: dayjs(placa.time).format('DD-MM-YYYYTHH:mm:ss') + '-0400', // ambos
            foto, //img
            indiceConfianca: null, //img
            parcialmente_reconhecida: placaFoiTotalmenteReconhecida(placa), //ambos
            placa: placa.plate, //ambos
            tipo_da_placa: null, // img
            sentido: process.env.SENTIDO, //ambos
            velocidade: null, //img
        }
    })
}