import prisma from "../../prisma/connection.js";
import log from "../../logs/betterLog.js";

const captures = prisma.captures;
export default async function getUltimoId(deImagem = false) {
    let where = { NOT: { json_dispatch_date_time: null }  }
    let orderBy = [
        { json_dispatch_date_time: 'desc' }
    ];

    if (deImagem) {
        where = { NOT: { img_dispatch_date_time: null } }
        orderBy = [
            { img_dispatch_date_time: 'desc' }
        ];
    }

    orderBy.push({
        id: 'desc'
    });

    let ultimoId;

    try {
        ultimoId = await captures.findFirst({
            select: { id: true },
            where,
            orderBy,
        })
    } catch (error) {
        log('ERRO AO BUSCAR ULTIMO ID', error)
        ultimoId = 0;
    }

    return ultimoId;
}