import prisma from './connection.js'
import axios from 'axios';
import dayjs from 'dayjs';
import log from './logs/betterLog.js'
import enviarPlacaParaSEFAZ from './api/enviarParaSEFAZ.js'
import Jimp from 'jimp';


axios.defaults.headers.post['Content-Type'] = 'application/json'
axios.defaults.baseURL = 'http://localhost:3092';

const placas_capturadas = prisma.t_log;

async function getPlacasCapturadas () {
  console.log('Inicio do retorno placas capturadas')
  const placas = await placas_capturadas.findMany({
    take: 100,
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
    orderBy: {
      tentativa_de_envio: 'desc'
    },
    orderBy: {
      tid: 'asc',
    }
  }).catch(error => {
    log(error.message, true)
    console.log('Deu pau no corsa')
    return [];
  });
  console.log('Retornando placas capturadas')
  return placas;
}

async function getUltimoId () {
  console.log('Pegando ultimo id')
  let ultimo_id = await placas_capturadas.findFirst({
    select: { tid: true },
    orderBy: { tid: 'desc'}
  }).catch(error => {
    log(error.message, true)
  });

  if (! ultimo_id) {
    ultimo_id = 0;
  }

  return ultimo_id;
}

async function getFotoComLegenda(placa) {
  console.log('Pegando foto com legenda')
  const alturaFundoPreto = 25;
  const image = await Jimp.read(placa.t_image.image);
  const fundoPreto = new Jimp(image.bitmap.width, alturaFundoPreto, '#000000');
  const font = await Jimp.loadFont('fonts/font.fnt');
  const legenda = getLegendaDaCaptura();
  image.composite(fundoPreto, 0, image.bitmap.height - alturaFundoPreto);
  image.print(font, 5, image.bitmap.height - alturaFundoPreto, legenda);
  image.quality(70);
  const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
  return buffer.toString('base64');
}

async function montarDadosParaEnvio(placas) {
    console.log('montando dados')
    const ultimo_id = await getUltimoId();
    return placas.forEach(async (placa) => {
      const foto = await getFotoComLegenda(placa);
      console.log(foto);

      return {
        id: placa.tid,
        cEQP: "CODIGO_A_SER_INFORMADO",
        dhPass: dayjs(placa.time_best).format('YYYY-MM-DD HH:mm:ss:SSS'),
        foto,
        indiceConfianca: placa.recognition_quality,
        placa: placa.plate_recognized,
        tipo_da_placa: placa.country_standard,
        ultimo_id,
        velocidade: placa.speed
      }
  });
}

function getLegendaDaCaptura(placa) {
  if (! placa) {
    return '';
  }
  return `Endereço: HILDA BERGA DUARTE, 870, JARDIM CENTRAL DATA: ${dayjs(placa.time_best).format('DD/MM/YYYY')} HORA: ${dayjs(placa.time_best).format('HH:mm:ss')} Sentido: GUÁIRA_MUNDO-NOVO  Município: DOURADOS UF: MS`
}

const placas = await getPlacasCapturadas();
montarDadosParaEnvio(placas);