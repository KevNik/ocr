export default function placaFoiTotalmenteReconhecida({ plate }) {
    return (plate.includes('?') || plate.includes('unknown'));
}