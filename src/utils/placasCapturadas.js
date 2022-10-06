import prisma from "../../prisma/connection.js";
import log from '../../logs/betterLog.js'

const placas_capturadas = prisma.captures;

export default async function getPlacasCapturadas(semFoto = false) {
    let where = { img_dispatch_date_time: null }
    let orderBy = [
        { img_dispatch_date_time: 'asc' },
        { id: 'asc' }
    ]

    if (semFoto) {
        where = { json_dispatch_date_time: null }
        orderBy = [
            { json_dispatch_date_time: 'asc' },
            { id: 'asc' }
        ]
    }

    try {
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
            orderBy
        })
    } catch (error) {
        log('ERRO AO BUSCAR PLACAS', error)
        return [];
    }
}