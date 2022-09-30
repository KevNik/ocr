import prisma from '../prisma/connection.js';
import dayjs from 'dayjs';
import axios from "axios";

axios.defaults.headers.post['Content-Type'] = 'application/json';

const { t_log, t_image } = prisma;

class RequisicaoSEFAZ {
	constructor(t_log, t_image) {
		this.t_log = t_log;
		this.t_image = t_image;
		this.tentativas_de_envio = process.env.TENTATIVAS_DE_ENVIO;
		this.urlJSON = `${process.env.IP_DO_SERVIDOR}:${process.env.PORTA_JSON}/${process.env.ENDPOINT_PLACAS_JSON}`;
		this.urlIMG = `${process.env.IP_DO_SERVIDOR}:${process.env.PORTA_IMG}/${process.env.ENDPOINT_PLACAS_IMG}`;
	}

	async atualizarStatusDeTentativaDeEnvioJSON({ id }) {
		const placaAtualizada = await this.t_log.update({
			where: {
				tid: id,
			},
			data: {
				tentativa_de_envio: dayjs().format()
			}
		});

		return placaAtualizada.tentativa_de_envio != null;
	}


	async atualizarStatusDeEnvioDaPlacaJSON({ id }) {

		t_log.update({
			where: {
				tid: id,
			},
			data: {
				horario_de_envio: dayjs().format(),
			}
		})
	}

	async atualizarStatusDeTentativaDeEnvioIMG({ id }) {
		const placaAtualizada = await this.t_image.update({
			where: {
				tid: id,
			},
			data: {
				data_e_hora_da_tentativa_do_envio: dayjs().format()
			}
		});

		return placaAtualizada.tentativa_de_envio != null;
	}

	async atualizarStatusDeEnvioDaPlacaIMG ({ id }) {
		const imagemAtualizada = await this.t_image.update({
			where: {
				tid: id
			},
			data: {
				horario_de_envio: dayjs().format()
			}
		})

		return imagemAtualizada != null;

	}

	async enviarPlacaJSON (placa) {
		const atualizou = await this.atualizarStatusDeTentativaDeEnvioJSON(placa);
		placa = { ...placa, foto: null }
		
		axios.post('http://localhost:3092/placas-ocr', placa)
			.then(response => {
			if (response.data) {
				const statusDeEnvioAtualizado = this.atualizarStatusDeEnvioDaPlaca(placa);
				return { enviado: true };
			}

			return { enviado: false };
		})
		.catch(err => console.log(err))

	}

	async enviarPlacaIMG(placa) {
		const atualizou = await this.atualizarStatusDeTentativaDeEnvioIMG(placa);

		for (let tentativas = 0; tentativas < this.tentativas_de_envio; tentativas++) {
			await axios.post(this.urlIMG, placa)
				.then(async response => {
					if (response.data) {
						await this.atualizarStatusDeEnvioDaPlacaIMG(placa);
						return { enviado: true };
					}

					return { enviado: false };
				})
				.catch(err => console.log(err))			
		}
	}
}

const ApiSEFAZ = new RequisicaoSEFAZ(t_log, t_image);
export default ApiSEFAZ;