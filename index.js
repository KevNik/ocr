import prisma from './prisma/connection.js'
import dayjs from 'dayjs';
import log from './logs/betterLog.js'
import Jimp from 'jimp';
import requisicaoSEFAZ from './api/RequisicaoSEFAZ.js'

const placas_capturadas = prisma.captures;
var fecharPrograma = false;
let aguardandoJson = false;
var aguardandoImg = false;

function alterarEstadoDeAguardoJSON(deveAguardar) {
	aguardandoJson = deveAguardar
}

const error_log = mensagem => {
	log(mensagem, true)
}

async function getPlacasCapturadas (semFoto = false) {
	let where = { img_dispatch_date_time: null }

	if (semFoto) {
		alterarEstadoDeAguardoJSON(true)

		where = { json_dispatch_date_time: null }
	}

	return await placas_capturadas.findMany({
		select: {
			id: true,
			date_time: true,
			plate: true,
			capture_way: true,
			camera: true,
			file_path: true
		},
		where,
		orderBy: [
			{ json_dispatch_date_time: 'asc' },
			{ id: 'asc' },
		],
	}).catch(error => {
		fecharPrograma = true;
		error_log(error.message)
		return [];
	});
}

async function getUltimoId () {
	let ultimo_id = await placas_capturadas.findFirst({
		select: { id: true },
		orderBy: { id: 'desc'}
	}).catch(error => {
		fecharPrograma = true;
		error_log(error.message)
	});

	if (! ultimo_id) {
		ultimo_id = 0;
	}

	return ultimo_id;
}


function getLegendaDaCaptura(placa) {
	return `Placa: ${placa.plate}Endereço: ${process.env.ENDERECO} DATA: ${dayjs(placa.date_time).format('DD/MM/YYYY')} HORA: ${dayjs(placa.date_time).format('HH:mm:ss:SSS')} Sentido: ${placa.capture_way}  Município: ${process.env.MUNICIPIO} UF: ${process.env.UF}`
}


async function getFotoComLegenda(placa) {
	const alturaFundoPreto = 25;

	try {
		const image = await Jimp.read(`${process.env.CAMINHO_DAS_PLACAS}/${placa.file_path}`);
	} catch (error) {
		log('ERRO AO LER IMAGEM', error)
		return null;
	}

	const fundoPreto = new Jimp(image.bitmap.width, alturaFundoPreto, '#000000')
	const legenda = getLegendaDaCaptura(placa)
	const font = await Jimp.loadFont('./fonts/font.fnt')
	await image.composite(fundoPreto, 0, image.bitmap.height - alturaFundoPreto)
	await image.print(font, 5, image.bitmap.height - alturaFundoPreto, legenda);
	await image.quality(60)
	const buffer = await image.getBufferAsync(Jimp.MIME_PNG)
	return buffer.toString('base64')

}

function placaFoiTotalmenteReconhecida({ plate }) {
	return (plate.includes('#') || plate.includes('unknown'));
}

async function montarDadosParaEnvio(semFoto = false) {
	const placas = await getPlacasCapturadas(semFoto);

	const ultimo_id = await getUltimoId();
	return await placas.map(async placa => {
		let foto = null;
		if (! semFoto) {
			foto = await getFotoComLegenda(placa)
		}

		return {
			id: placa.id, // img
			cEQP: process.env.CODIGO_EQUIPAMENTO, // ambos
			dhPass: dayjs(placa.time).format('YYYY-MM-DD HH:mm:ss:SSS'), // ambos
			foto, //img
			indiceConfianca: null, //img
			parcialmente_reconhecida: placaFoiTotalmenteReconhecida(placa), //ambos
			placa: placa.plate, //ambos
			tipo_da_placa: null, // img
			sentido: process.env.SENTIDO, //ambos
			velocidade: null, //img
		};
	});
}

async function sincronizaPlacasJson () {	
	const placas = await montarDadosParaEnvio(true);
	
	await placas.forEach(async (placa) => {
		placa = await placa;
		for(let i = 0; i < process.env.TENTATIVAS_DE_ENVIO_JSON; i++) {
			const resposta = await requisicaoSEFAZ.enviarPlacaJSON(placa);
			console.log('resposta do envio')

			if (resposta.enviado) {
				const { json_dispatch_date_time, id } = await requisicaoSEFAZ.atualizarStatusDeEnvioDaPlacaJSON(placa);
				if (json_dispatch_date_time) {
					if (process.env.APP_LEVEL != 'production') {
						console.log(`JSON ${id} enviada`)
						break;
					}
				}
			} else {
				const { id } = await placa;
				log(`JSON ${id} não enviada`)
			}

		}
	})
	
	alterarEstadoDeAguardoJSON(false);
}

async function sincronizaPlacasImg () {
	const placas = await montarDadosParaEnvio();
	aguardandoImg = true
	await placas.forEach(async placa => {
		placa = await placa;
		for(let i = 0; i < process.env.TENTATIVAS_DE_ENVIO_IMG; i++){
			const resposta = await requisicaoSEFAZ.enviarPlacaIMG(placa);
			if (resposta.enviado) {
				const { img_dispatch_date_time, id } = await requisicaoSEFAZ.atualizarStatusDeEnvioDaPlacaJSON(placa);
				if (img_dispatch_date_time) {
					log(`IMG ${id} enviada`, true)
				}
			} else {
				log(`IMG ${placa.id} NÃO ENVIADA`, true)
			}
		}

	});
	aguardandoImg = false;
}

function finalizaPrograma () {
	fecharPrograma = true;
	alterarEstadoDeAguardoJSON(false)
	aguardandoImg = false
	console.log('Finalizando programa, aguarde');
}

process.on('SIGINT', finalizaPrograma)
try {
	console.log('Programa iniciado em: ' + dayjs().format('DD/MM/YYYY HH:mm:ss'));
	await setInterval(async () => {
		if (fecharPrograma) process.exit()
			
		if (! aguardandoJson) {
			await sincronizaPlacasJson();
		}				
		

		if (! aguardandoImg) {
			// await sincronizaPlacasImg();
		}
		
		if (fecharPrograma) process.exit()	
	}, 100)
	 
} catch (e) {
	log('ERRO AO INICIALIZAR PROGRAMA', e)
}