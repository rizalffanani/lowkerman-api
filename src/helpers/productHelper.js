export function baseUrl() {
    return process.env.BASE_URL || 'http://localhost:5000/';
}

export function formatRupiah(angka) {
    return Number(angka).toLocaleString('id-ID');
}

// Fungsi utama untuk memproses data
export function bundleDetail(row) {
    const pprice = row.type_payment === 'free' ? 'Gratis' : row.real_price;
    const ppriceRp = row.type_payment === 'free' ? 'Gratis' : formatRupiah(row.real_price);

    return {
        productId: row.id_product,
        slug: row.slug,
        image: `${baseUrl()}uploads/produk/${row.image}`,
        name: row.name_product,
        like: row.like,
        pprice,
        ppriceRp,
        discount: row.discount_price,
        discountRp: formatRupiah(row.discount_price),
        pcategory: row.slug_product_category,
        nameCat: row.name_product_category,
        username: row.username,
        userFullName: row.name,
        userFoto: `${baseUrl()}uploads/profil/${row.foto}`
    };
}

export function isYoutubeUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    const regex = new RegExp(
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(&.*)?$/
    );

    return regex.test(url);
}