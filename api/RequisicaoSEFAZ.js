import prisma from '../prisma/connection.js';
import dayjs from 'dayjs';
import axios from "axios";

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
		const placa_atualizaada = await this.captures.update({
			where: {
				id: id,
			},
			data: {
				json_dispatch_date_time: dayjs().format(),
			}
		});

		return placa_atualizaada != null;
	}

	async atualizarStatusDeEnvioDaPlacaIMG ({ id }) {
		const imagemAtualizada = await this.captures.update({
			where: {
				id
			},
			data: {
				img_dispatch_date_time: dayjs().format()
			}
		})

		return imagemAtualizada != null;

	}

	async enviarPlacaJSON (placa) {
		if (! placa) {
			console.log('Sem placa')
			return { enviado: false }
		}
		let response = undefined;

		try {
			response = await axios.post(this.urlJSON, placa)
		} catch (error) {
			console.error(error)
			return { enviado: false }
		}

		if (response.data) {
			return { enviado: true }
		} else {
			return { enviado: false }
		}

	}

	async enviarPlacaIMG(placa) {
		try {
			const response = await axios.post(this.urlIMG, placa);
		} catch (error) {
			console.error(error);
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