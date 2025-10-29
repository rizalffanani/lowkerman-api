import { encodeCustomId } from '../utils/encode.js';

export function baseUrl() {
    return process.env.BASE_URL || 'http://localhost:5000/';
}

export function formatRupiah(angka) {
    return Number(angka).toLocaleString('id-ID');
}

export function label(namaKota, online, offline) {
    let text = `${namaKota} | `;
    if (online === '1') text += 'Online ';
    if (online === '1' && offline === '1') text += '& ';
    if (offline === '1') text += 'Tatap Muka ';
    return text.trim();
}

// Fungsi utama untuk memproses data
export function bundleDetail(row) {
    const online = row.online;
    const offline = row.tatap_muka || row.offline; // tangani variasi nama kolom
    const idkota = row.id_kota || row.id_city;
    const namaKota = row.nama_kota || row.name_city;
    const labelText = label(namaKota, online, offline);
    const id_privat = encodeCustomId(row.id_privat || row.id_privat || row.id);

    return {
        privatId: id_privat,
        slug: row.slug,
        idkategori: row.id_privat_kategori,
        namaKategori: row.nama_kategori,
        detail: row.deskripsi,
        biaya: row.biaya,
        biayaRp: formatRupiah(row.biaya),
        online,
        offline,
        idkota,
        label: labelText,
        iduser: row.id_user,
        user: row.username,
        userFullName: row.first_name,
        logo: `${baseUrl()}image/profil/${row.foto}`,
        nowa: row.phone,
        linkWa: row.link_url,
    };
}