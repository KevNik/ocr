import montarDadosParaEnvio from "./utils/dadosDeEnvio.js";
import requisicaoSEFAZ from "../api/RequisicaoSEFAZ.js";
import log from "../logs/betterLog.js";

let aguardandoImg = false;
let finalizarPrograma = false;

function fecharPrograma () {
    finalizarPrograma = true;
    aguardandoImg = false;
}

function atualizarEstadoDeAguardo(deveAguardar) {
    aguardandoImg = deveAguardar;
}

async function sincronizarPlacasIMG() {
    atualizarEstadoDeAguardo(true)
    const placas = await montarDadosParaEnvio();
    await placas.forEach(async placa => {
        for (let i = 0; i < process.env.TENTATIVAS_DE_ENVIO_IMG; i++) {
            const { enviado } = await requisicaoSEFAZ.enviarPlacaIMG(placa);
            if (enviado) {
                const { img_dispatch_date_time, id } = await requisicaoSEFAZ.atualizarStatusDeEnvioDaPlacaIMG(placa);
                if (img_dispatch_date_time) {
                    log(`IMAGEM ${id} enviada`, true);
                    break;
                }
            } else {
                log(`IMAGEM ${placa.id} NÃO ENVIADA`, true)
            }
        }
    })
    atualizarEstadoDeAguardo(false)
}

process.on('SIGINT', fecharPrograma)

try {
    setInterval(async () => {
        if (finalizarPrograma) process.exit()

        if (!aguardandoImg) {
            await sincronizarPlacasIMG();
        }

        if (finalizarPrograma) process.exit()
    }, 3000);
} catch (error) {
    log('ERRO AO INICIALIZAR O PROGRAMA', error);
}