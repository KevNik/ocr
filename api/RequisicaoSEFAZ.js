import prisma from '../prisma/connection.js';
import dayjs from 'dayjs';
import axios from "axios";
import log from "../logs/betterLog.js";

axios.defaults.headers.post['Content-Type'] = 'application/json';

const { captures } = prisma;

class RequisicaoSEFAZ {
	constructor(captures) {
		this.captures = captures;
		this.tentativas_de_envio = process.env.TENTATIVAS_DE_ENVIO;
		this.urlJSON = `${process.env.IP_DO_SERVIDOR}:${process.env.PORTA_JSON}/${process.env.ENDPOINT_PLACAS_JSON}`;
		this.urlIMG = `${process.env.IP_DO_SERVIDOR}:${process.env.PORTA_IMG}/${process.env.ENDPOINT_PLACAS_IMG}`;
	}

	async atualizarStatusDeEnvioDaPlacaJSON({ id }) {
		if (! id) {
			log('SEM ID PARA ATUALIZAR STATUS DE ENVIO JSON', true);
			return false;
		}
		
		let placa_atualizada;

		try {
			placa_atualizada = await this.captures.update({
				where: {
					id: id,
				},
				data: {
					json_dispatch_date_time: dayjs().format(),
				}
			});
		} catch (error) {
			log('ERROR AO ATUALIZAR STATUS DE ENVIO JSON', error)
		}


		return placa_atualizada != null;
	}

	async atualizarStatusDeEnvioDaPlacaIMG ({ id }) {
		if (! id) {
			log('SEM ID PARA ATUALIZAR STATUS DE ENVIO DA IMAGEM', true);
			return false;
		}
		try {
			const imagemAtualizada = await this.captures.update({
				where: {
					id
				},
				data: {
					img_dispatch_date_time: dayjs().format()
				}
			})
		} catch (error) {
			log('ERRO AO ATUALIZAR STATUS DE ENVIO DA IMAGEM', erro)
			return false;
		}

		return imagemAtualizada != null;

	}

	async enviarPlacaJSON (placa) {
		if (! placa) {
			log('SEM PLACA PARA ENVIO JSON', true)
			return { enviado: false }
		}

		let response;

		try {
			response = await axios.post(this.urlJSON, placa)
		} catch (error) {
			log('erro', error);
			return { enviado: false }
		}

		return response.data ? { enviado: true } : { enviado: false }
	}

	async enviarPlacaIMG(placa) {
		if (!(placa && placa.foto)) {
			log('SEM FOTO PARA ENVIO', true)
			return { enviado: false }
		}
		
		let response;
		
		try {
			response = await axios.post(this.urlIMG, placa);
		} catch (error) {
			log('ERRO AO ENVIAR PLACA', error)
			return { enviado: false }
		}

		if (response.data) {
			return { enviado: true }
		} else {
			return { enviado: false }
		}

	}
}

const requisicaoSEFAZ = new RequisicaoSEFAZ(captures);
export default requisicaoSEFAZ;