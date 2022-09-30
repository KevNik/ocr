import prisma from './prisma/connection.js'
import dayjs from 'dayjs';
import log from './logs/betterLog.js'
import Jimp from 'jimp';
import ApiSEFAZ from './api/enviarParaSEFAZ.js'

const placas_capturadas = prisma.t_log;

const error_log = mensagem => {
	log(mensagem, true)
}

async function getPlacasCapturadas () {
	return await placas_capturadas.findMany({
		take: 1,
		select: {
			tid: true,
			lpr_name: true,
			speed: true,
			plate_recognized: true,
			recognition_quality: true,
			time_best: true,
			camera_id: true,
			country_standard: true,
			direction_name: true, tentativa_de_envio: true,
			t_image: {
				select: {
					image: true,
				},
			},
		},
		where: {
			tentativa_de_envio: null,
		},
		orderBy: [
			{ tentativa_de_envio: 'desc' },
			{ tid: 'asc' },
		],
	}).catch(error => {
		error_log(error.message)
		return [];
	});
}

async function getUltimoId () {
	let ultimo_id = await placas_capturadas.findFirst({
		select: { tid: true },
		orderBy: { tid: 'desc'}
	}).catch(error => {
		error_log(error.message)
	});

	if (! ultimo_id) {
		ultimo_id = 0;
	}

	return ultimo_id;
}


function getLegendaDaCaptura(placa) {
	return `Endereço: HILDA BERGA DUARTE, 870, JARDIM CENTRAL DATA: ${dayjs(placa.time_best).format('DD/MM/YYYY')} HORA: ${dayjs(placa.time_best).format('HH:mm:ss:SSS')} Sentido: ${process.env.SENTIDO}  Município: ${process.env.MUNICIPIO} UF: ${process.env.UF}`
}


async function getFotoComLegenda(placa) {
	const alturaFundoPreto = 25;
	const image = await Jimp.read(placa.t_image.image);
	const fundoPreto = new Jimp(image.bitmap.width, alturaFundoPreto, '#000000');
	const font = await Jimp.loadFont('fonts/font.fnt');
	const legenda = getLegendaDaCaptura(placa);
	image.composite(fundoPreto, 0, image.bitmap.height - alturaFundoPreto);
	image.print(font, 5, image.bitmap.height - alturaFundoPreto, legenda);
	image.quality(70);
	const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
	return buffer.toString('base64');
}


async function montarDadosParaEnvio() {
	const placas = await getPlacasCapturadas();
	const ultimo_id = await getUltimoId();
	return await Promise.all(placas.map(async (placa) => {
		const foto = await getFotoComLegenda(placa);
		return {
			id: placa.tid,
			cEQP: process.env.CODIGO_EQUIPAMENTO,
			dhPass: dayjs(placa.time_best).format('YYYY-MM-DD HH:mm:ss:SSS'),
			foto,
			indiceConfianca: placa.recognition_quality,
			placa: placa.plate_recognized,
			tipo_da_placa: placa.country_standard,
			sentido: process.env.SENTIDO,
			ultimo_id,
			velocidade: placa.speed
		};
	}));
}

(async () => {
	const placas = await montarDadosParaEnvio();
	Promise.all(placas.map(async placa => {
		const resposta = await ApiSEFAZ.enviarPlacaJSON(placa);
		console.log(resposta)
		if (resposta.enviado) {
			console.log('açlkdsjaf')
		} else {
			console.log('fudeu')
		}
	}))
})();