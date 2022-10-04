import prisma from './prisma/connection.js'
import dayjs from 'dayjs';
import log from './logs/betterLog.js'
import Jimp from 'jimp';
import ApiSEFAZ from './api/enviarParaSEFAZ.js'

const placas_capturadas = prisma.captures;

const error_log = mensagem => {
	log(mensagem, true)
}

async function getPlacasCapturadas () {
	return await placas_capturadas.findMany({
		take: 10,
		select: {
			id: true,
			date_time: true,
			plate: true,
			capture_way: true,
			camera: true,
			file_path: true
		},
		where: {
			json_dispatch_date_time: null,
			img_dispatch_date_time: null
		},
		orderBy: [
			{json_dispatch_date_time: 'asc'},
			{img_dispatch_date_time: 'asc'},
			{ id: 'asc' },
		],
	}).catch(error => {
		rodarPrograma = false
		error_log(error.message)
		return [];
	});
}

async function getUltimoId () {
	let ultimo_id = await placas_capturadas.findFirst({
		select: { id: true },
		orderBy: { id: 'desc'}
	}).catch(error => {
		rodarPrograma = false
		error_log(error.message)
	});

	if (! ultimo_id) {
		ultimo_id = 0;
	}

	return ultimo_id;
}


function getLegendaDaCaptura(placa) {
	return `Endereço: ${process.env.ENDERECO} DATA: ${dayjs(placa.date_time).format('DD/MM/YYYY')} HORA: ${dayjs(placa.date_time).format('HH:mm:ss:SSS')} Sentido: ${placa.capture_way}  Município: ${process.env.MUNICIPIO} UF: ${process.env.UF}`
}


async function getFotoComLegenda(placa) {
	const alturaFundoPreto = 25;

	try {
		const image = await Jimp.read(`${process.env.CAMINHO_DAS_PLACAS}/${placa.file_path}`);
	} catch (error) {
		console.log(error);
		rodarPrograma = false
		return null;
	}
	const fundoPreto = new Jimp(image.bitmap.width, alturaFundoPreto, '#000000');
	const font = await Jimp.loadFont('fonts/font.fnt');
	const legenda = getLegendaDaCaptura(placa);
	image.composite(fundoPreto, 0, image.bitmap.height - alturaFundoPreto);
	image.print(font, 5, image.bitmap.height - alturaFundoPreto, legenda);
	image.quality(70);
	const buffer = await image.getBufferAsync(Jimp.AUTO);
	return buffer.toString('base64');
}


async function montarDadosParaEnvio() {
	const placas = await getPlacasCapturadas();
	const ultimo_id = await getUltimoId();
	return await Promise.all(placas.map(async (placa) => {
		const foto = await getFotoComLegenda(placa); 
		return {
			id: placa.id,
			cEQP: process.env.CODIGO_EQUIPAMENTO,
			dhPass: dayjs(placa.time).format('YYYY-MM-DD HH:mm:ss:SSS'),
			foto,
			indiceConfianca: null,
			placa: placa.plate,
			tipo_da_placa: null,
			sentido: process.env.SENTIDO,
			ultimo_id,
			velocidade: null,
		};
	}));
}

let rodarPrograma = true;

while (rodarPrograma) {
	const placas = await montarDadosParaEnvio();
	await placas.forEach(async placa => {
		for(let i = 0; i < process.env.TENTATIVAS_DE_ENVIO; i++) {
			const resposta = await ApiSEFAZ.enviarPlacaJSON(placa);
			if (resposta.enviado) {
				const placa_atualizada = await ApiSEFAZ.atualizarStatusDeEnvioDaPlacaJSON(placa);
				console.log(`${placa_atualizada.id} enviada`)
			} else {
				console.log(`${placa.id} não enviada`)
			}
		}
	})
	rodarPrograma = true;
}