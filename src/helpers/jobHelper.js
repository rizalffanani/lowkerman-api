import { encodeCustomId } from '../utils/encode.js';

export function baseUrl() {
    return process.env.BASE_URL || 'http://localhost:5000/';
}

export function formatRupiah(angka) {
    return Number(angka).toLocaleString('id-ID');
}

export function getBulan(bulan) {
    const namaBulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return namaBulan[Number(bulan) - 1] || "";
}

export function tglIndo(input) {
    if (input == null) return "";
    if (typeof input === "number") return tglIndo(new Date(input));
    if (input instanceof Date) {
        const y = input.getFullYear();
        const m = String(input.getMonth() + 1).padStart(2, "0");
        const d = String(input.getDate()).padStart(2, "0");
        return `${d} ${getBulan(m)} ${y}`;
    }

    const s = String(input).trim();

    const match = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [, year, month, day] = match;
        return `${day} ${getBulan(month)} ${year}`;
    }

    const parsed = new Date(s);
    if (!isNaN(parsed)) return tglIndo(parsed);

    return "";
}

export function selisihHariPosting(date) {
    const date1 = new Date(date);
    const date2 = new Date(); // tanggal sekarang
    const diffMs = date2 - date1; // selisih dalam milidetik
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // ubah ke hari

    if (totalDays > 30) {
        return tglIndo(date); // fungsi tglIndo dari contoh sebelumnya
    }

    if (totalDays === 0) {
        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (totalHours > 0) {
            return `${totalHours} jam yang lalu`;
        } else {
            return "Baru";
        }
    }

    return `${totalDays} hari yang lalu`;
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
    return {
        lokerId: encodeCustomId(row.id_loker),
        slug: row.slug,
        logo: `${baseUrl()}uploads/logo-perusahaan/${row.logo}`,
        namaLoker: row.nama_loker,
        codeperusahaan: `KP89320${row.id_perusahaan}`,
        namaPerusahaan: row.nama_perusahaan,
        tglPosting: selisihHariPosting(row.tanggal_posting),
        tglIndo: tglIndo(row.tanggal_posting),
        tglDeadline: tglIndo(row.tanggal_posting),
        tempatKerja: row.lokasi_loker,
        sistemKerja: row.jenis_loker,
        caption: row.detail_loker,
        userPost: row.first_name,
        eksternal: row.eksternal,
        view: row.total_view,
        poster: row.poster ? `${baseUrl()}uploads/loker/cover/${row.poster}` : '',
        location: row.id_prov == 0 ? row.nama_prov : `${row.nama_kota}, ${row.nama_prov}`
    };
}