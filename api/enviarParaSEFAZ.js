import axios from 'axios'

export default async function enviarPlacaParaSEFAZ (placa) {
  const response = await axios.post('/enviar-placas', placa)
    .catch(error => console.error(error));

  if (response.ok) {
   return {
    envida: false,
    data: response.data
   }
  }
  
  return {
    enviada: true,
    data: response.data
  }

}