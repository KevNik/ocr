import Jimp from "jimp";
import {getLegendaDaCaptura} from "./legendaDaCaptura.js";
import log from "../../logs/betterLog.js";

async function comporFundoPreto (image, fundoPreto, alturaFundoPreto) {
    await image.composite(fundoPreto, 0, image.bitmap.height - alturaFundoPreto)
    await image.composite(fundoPreto, 0, image.bitmap.height - (alturaFundoPreto * 2))
    await image.composite(fundoPreto, 0, image.bitmap.height - (alturaFundoPreto * 3))
}

async function printarLegenda (image, font, alturaFundoPreto, legenda) {
    await image.print(font, 5, image.bitmap.height - alturaFundoPreto, legenda.superior);
    await image.print(font, 5, image.bitmap.height - (alturaFundoPreto * 2), legenda.intermediario);
    await image.print(font, 5, image.bitmap.height - (alturaFundoPreto * 3), legenda.inferior);
}

async function imageToString(image) {
    const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    return await buffer.toString('base64');
}

export default async function getFotoComLegenda(placa) {
    const alturaDoFundoPreto = 25;
    const cor = '#000000'

    let image;

    try {
        image = await Jimp.read(`${process.env.CAMINHO_DAS_PLACAS}/${placa.file_path}`);
    } catch (error) {
        log('ERROR AO CARREGAR IMAGEM', error);
        return null;
    }

    const fundoPreto = new Jimp(image.bitmap.width, alturaDoFundoPreto * 3, cor);
    const legenda = await getLegendaDaCaptura(placa);
    const font = await Jimp.loadFont('./fonts/font.fnt');
    await comporFundoPreto(image, fundoPreto, alturaDoFundoPreto)
    await printarLegenda(image, font, alturaDoFundoPreto, legenda)
    await image.quality(60);
    return imageToString(image);
}