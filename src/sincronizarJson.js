import montarDadosParaEnvio from "./utils/dadosDeEnvio.js";
import requisicaoSEFAZ from "../api/RequisicaoSEFAZ.js";
import log from "../logs/betterLog.js";

let aguardandoJson = false;
let finalizarPrograma = false;

function fecharPrograma () {
    finalizarPrograma = true;
    aguardandoJson = false;
}

function atualizarEstadoDeAguardo(deveAguardar) {
    aguardandoJson = deveAguardar;
}

async function sincronizarPlacasJSON() {
    atualizarEstadoDeAguardo(true);
    const placas = await montarDadosParaEnvio(true);

    await placas.forEach(async placa => {
        placa = await placa;
        const { enviado } = await requisicaoSEFAZ.enviarPlacaJSON(placa);
        if (enviado) {
            const { json_dispatch_date_time, id } = await requisicaoSEFAZ.atualizarStatusDeEnvioDaPlacaJSON(placa);
            if (json_dispatch_date_time) {
                log(`JSON ${id} enviado`);
            }
        } else {
            const { id } = placa;
            log(`JSON ${id} não enviado`, true);
        }
    });
    atualizarEstadoDeAguardo(false);
}

process.on('SIGINT', fecharPrograma)

try {
    setInterval(async () => {
        if (finalizarPrograma) process.exit()

        if (! aguardandoJson) {
            await sincronizarPlacasJSON();
        }

        if (finalizarPrograma) process.exit()
    },100);
} catch (error) {
    log('ERRO AO INICIALIZAR', error);
}