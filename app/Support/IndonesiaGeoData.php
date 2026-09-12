<?php

namespace App\Support;

/**
 * Geographic reference data for Indonesian cities, key districts, and postal code prefixes.
 *
 * Used as high-reliability fallback and offline resolver for geocoding, AI quick-fills,
 * and location mapping across the application.
 */
final class IndonesiaGeoData
{
    /**
     * Common locations mapped to coordinates, city, province, and timezone.
     * Specific districts / areas are listed before broader city names.
     *
     * @var array<string, array{lat: string, lng: string, city: string, province: string, tz: string}>
     */
    private const LOCATIONS = [
        // Lampung & Southern Sumatra
        'Way Halim' => ['lat' => '-5.3857', 'lng' => '105.2755', 'city' => 'Bandar Lampung', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Kedaton' => ['lat' => '-5.3789', 'lng' => '105.2577', 'city' => 'Bandar Lampung', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Teluk Betung' => ['lat' => '-5.4510', 'lng' => '105.2700', 'city' => 'Bandar Lampung', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Tanjung Karang' => ['lat' => '-5.4124', 'lng' => '105.2562', 'city' => 'Bandar Lampung', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Panjang' => ['lat' => '-5.4678', 'lng' => '105.3210', 'city' => 'Bandar Lampung', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Bandar Lampung' => ['lat' => '-5.3971', 'lng' => '105.2668', 'city' => 'Bandar Lampung', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Natar' => ['lat' => '-5.3168', 'lng' => '105.2014', 'city' => 'Lampung Selatan', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Bakauheni' => ['lat' => '-5.8672', 'lng' => '105.7533', 'city' => 'Lampung Selatan', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Kalianda' => ['lat' => '-5.5900', 'lng' => '105.6178', 'city' => 'Lampung Selatan', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Lampung Selatan' => ['lat' => '-5.5786', 'lng' => '105.5900', 'city' => 'Lampung Selatan', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Metro' => ['lat' => '-5.1136', 'lng' => '105.3067', 'city' => 'Metro', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Pringsewu' => ['lat' => '-5.3587', 'lng' => '104.9754', 'city' => 'Pringsewu', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Kotabumi' => ['lat' => '-4.8258', 'lng' => '104.8828', 'city' => 'Lampung Utara', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Lampung Tengah' => ['lat' => '-4.8988', 'lng' => '105.2307', 'city' => 'Lampung Tengah', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Lampung Timur' => ['lat' => '-5.1054', 'lng' => '105.6800', 'city' => 'Lampung Timur', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Lampung Barat' => ['lat' => '-5.1486', 'lng' => '104.1924', 'city' => 'Lampung Barat', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Tulang Bawang' => ['lat' => '-4.4820', 'lng' => '105.2440', 'city' => 'Tulang Bawang', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        'Lampung' => ['lat' => '-5.3971', 'lng' => '105.2668', 'city' => 'Bandar Lampung', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],

        // DKI Jakarta & Greater Jakarta
        'Jakarta Timur' => ['lat' => '-6.2250', 'lng' => '106.9004', 'city' => 'Jakarta Timur', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        'Jakarta Selatan' => ['lat' => '-6.2615', 'lng' => '106.8106', 'city' => 'Jakarta Selatan', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        'Jakarta Barat' => ['lat' => '-6.1683', 'lng' => '106.7588', 'city' => 'Jakarta Barat', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        'Jakarta Utara' => ['lat' => '-6.1384', 'lng' => '106.8640', 'city' => 'Jakarta Utara', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        'Jakarta Pusat' => ['lat' => '-6.1805', 'lng' => '106.8284', 'city' => 'Jakarta Pusat', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        'Cakung' => ['lat' => '-6.1823', 'lng' => '106.9452', 'city' => 'Jakarta Timur', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        'Tanjung Priok' => ['lat' => '-6.1320', 'lng' => '106.8714', 'city' => 'Jakarta Utara', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        'Marunda' => ['lat' => '-6.1130', 'lng' => '106.9630', 'city' => 'Jakarta Utara', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        'Pulogadung' => ['lat' => '-6.1912', 'lng' => '106.8990', 'city' => 'Jakarta Timur', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        'Jakarta' => ['lat' => '-6.2088', 'lng' => '106.8456', 'city' => 'Jakarta Pusat', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],

        // Banten
        'Tangerang Selatan' => ['lat' => '-6.2887', 'lng' => '106.7179', 'city' => 'Tangerang Selatan', 'province' => 'Banten', 'tz' => 'Asia/Jakarta'],
        'Bandara Soetta' => ['lat' => '-6.1256', 'lng' => '106.6559', 'city' => 'Tangerang', 'province' => 'Banten', 'tz' => 'Asia/Jakarta'],
        'Soekarno Hatta' => ['lat' => '-6.1256', 'lng' => '106.6559', 'city' => 'Tangerang', 'province' => 'Banten', 'tz' => 'Asia/Jakarta'],
        'Tangerang' => ['lat' => '-6.1783', 'lng' => '106.6319', 'city' => 'Tangerang', 'province' => 'Banten', 'tz' => 'Asia/Jakarta'],
        'Cikupa' => ['lat' => '-6.2378', 'lng' => '106.5230', 'city' => 'Tangerang', 'province' => 'Banten', 'tz' => 'Asia/Jakarta'],
        'Balaraja' => ['lat' => '-6.1960', 'lng' => '106.4420', 'city' => 'Tangerang', 'province' => 'Banten', 'tz' => 'Asia/Jakarta'],
        'Serang' => ['lat' => '-6.1200', 'lng' => '106.1500', 'city' => 'Serang', 'province' => 'Banten', 'tz' => 'Asia/Jakarta'],
        'Cilegon' => ['lat' => '-6.0170', 'lng' => '106.0538', 'city' => 'Cilegon', 'province' => 'Banten', 'tz' => 'Asia/Jakarta'],
        'Merak' => ['lat' => '-5.9333', 'lng' => '105.9980', 'city' => 'Cilegon', 'province' => 'Banten', 'tz' => 'Asia/Jakarta'],

        // West Java
        'Cikarang' => ['lat' => '-6.3039', 'lng' => '107.1537', 'city' => 'Cikarang', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        'Cibitung' => ['lat' => '-6.2620', 'lng' => '107.0980', 'city' => 'Bekasi', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        'Bekasi' => ['lat' => '-6.2383', 'lng' => '106.9756', 'city' => 'Bekasi', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        'Depok' => ['lat' => '-6.4025', 'lng' => '106.7942', 'city' => 'Depok', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        'Bogor' => ['lat' => '-6.5971', 'lng' => '106.8060', 'city' => 'Bogor', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        'Karawang' => ['lat' => '-6.3073', 'lng' => '107.3069', 'city' => 'Karawang', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        'Purwakarta' => ['lat' => '-6.5569', 'lng' => '107.4433', 'city' => 'Purwakarta', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        'Bandung' => ['lat' => '-6.9175', 'lng' => '107.6191', 'city' => 'Bandung', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        'Cimahi' => ['lat' => '-6.8723', 'lng' => '107.5422', 'city' => 'Cimahi', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        'Cirebon' => ['lat' => '-6.7320', 'lng' => '108.5523', 'city' => 'Cirebon', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        'Sukabumi' => ['lat' => '-6.9277', 'lng' => '106.9300', 'city' => 'Sukabumi', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        'Tasikmalaya' => ['lat' => '-7.3274', 'lng' => '108.2207', 'city' => 'Tasikmalaya', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],

        // Central Java & DIY
        'Semarang' => ['lat' => '-6.9667', 'lng' => '110.4167', 'city' => 'Semarang', 'province' => 'Jawa Tengah', 'tz' => 'Asia/Jakarta'],
        'Surakarta' => ['lat' => '-7.5755', 'lng' => '110.8243', 'city' => 'Surakarta', 'province' => 'Jawa Tengah', 'tz' => 'Asia/Jakarta'],
        'Solo' => ['lat' => '-7.5755', 'lng' => '110.8243', 'city' => 'Solo', 'province' => 'Jawa Tengah', 'tz' => 'Asia/Jakarta'],
        'Purwokerto' => ['lat' => '-7.4243', 'lng' => '109.2303', 'city' => 'Banyumas', 'province' => 'Jawa Tengah', 'tz' => 'Asia/Jakarta'],
        'Tegal' => ['lat' => '-6.8694', 'lng' => '109.1402', 'city' => 'Tegal', 'province' => 'Jawa Tengah', 'tz' => 'Asia/Jakarta'],
        'Pekalongan' => ['lat' => '-6.8886', 'lng' => '109.6753', 'city' => 'Pekalongan', 'province' => 'Jawa Tengah', 'tz' => 'Asia/Jakarta'],
        'Kudus' => ['lat' => '-6.8048', 'lng' => '110.8405', 'city' => 'Kudus', 'province' => 'Jawa Tengah', 'tz' => 'Asia/Jakarta'],
        'Magelang' => ['lat' => '-7.4797', 'lng' => '110.2177', 'city' => 'Magelang', 'province' => 'Jawa Tengah', 'tz' => 'Asia/Jakarta'],
        'Yogyakarta' => ['lat' => '-7.7956', 'lng' => '110.3695', 'city' => 'Yogyakarta', 'province' => 'DI Yogyakarta', 'tz' => 'Asia/Jakarta'],
        'Jogja' => ['lat' => '-7.7956', 'lng' => '110.3695', 'city' => 'Jogja', 'province' => 'DI Yogyakarta', 'tz' => 'Asia/Jakarta'],

        // East Java
        'Surabaya' => ['lat' => '-7.2575', 'lng' => '112.7521', 'city' => 'Surabaya', 'province' => 'Jawa Timur', 'tz' => 'Asia/Jakarta'],
        'Sidoarjo' => ['lat' => '-7.4726', 'lng' => '112.7156', 'city' => 'Sidoarjo', 'province' => 'Jawa Timur', 'tz' => 'Asia/Jakarta'],
        'Gresik' => ['lat' => '-7.1566', 'lng' => '112.6555', 'city' => 'Gresik', 'province' => 'Jawa Timur', 'tz' => 'Asia/Jakarta'],
        'Malang' => ['lat' => '-7.9666', 'lng' => '112.6326', 'city' => 'Malang', 'province' => 'Jawa Timur', 'tz' => 'Asia/Jakarta'],
        'Kediri' => ['lat' => '-7.8480', 'lng' => '112.0178', 'city' => 'Kediri', 'province' => 'Jawa Timur', 'tz' => 'Asia/Jakarta'],
        'Madiun' => ['lat' => '-7.6298', 'lng' => '111.5239', 'city' => 'Madiun', 'province' => 'Jawa Timur', 'tz' => 'Asia/Jakarta'],
        'Jember' => ['lat' => '-8.1845', 'lng' => '113.6681', 'city' => 'Jember', 'province' => 'Jawa Timur', 'tz' => 'Asia/Jakarta'],
        'Banyuwangi' => ['lat' => '-8.2192', 'lng' => '114.3691', 'city' => 'Banyuwangi', 'province' => 'Jawa Timur', 'tz' => 'Asia/Jakarta'],

        // Sumatra (Other)
        'Palembang' => ['lat' => '-2.9761', 'lng' => '104.7754', 'city' => 'Palembang', 'province' => 'Sumatera Selatan', 'tz' => 'Asia/Jakarta'],
        'Batam' => ['lat' => '1.1301', 'lng' => '104.0529', 'city' => 'Batam', 'province' => 'Kepulauan Riau', 'tz' => 'Asia/Jakarta'],
        'Tanjung Pinang' => ['lat' => '0.9167', 'lng' => '104.4500', 'city' => 'Tanjung Pinang', 'province' => 'Kepulauan Riau', 'tz' => 'Asia/Jakarta'],
        'Medan' => ['lat' => '3.5952', 'lng' => '98.6722', 'city' => 'Medan', 'province' => 'Sumatera Utara', 'tz' => 'Asia/Jakarta'],
        'Padang' => ['lat' => '-0.9471', 'lng' => '100.4172', 'city' => 'Padang', 'province' => 'Sumatera Barat', 'tz' => 'Asia/Jakarta'],
        'Pekanbaru' => ['lat' => '0.5071', 'lng' => '101.4478', 'city' => 'Pekanbaru', 'province' => 'Riau', 'tz' => 'Asia/Jakarta'],
        'Jambi' => ['lat' => '-1.6101', 'lng' => '103.6131', 'city' => 'Jambi', 'province' => 'Jambi', 'tz' => 'Asia/Jakarta'],
        'Bengkulu' => ['lat' => '-3.7928', 'lng' => '102.2608', 'city' => 'Bengkulu', 'province' => 'Bengkulu', 'tz' => 'Asia/Jakarta'],
        'Banda Aceh' => ['lat' => '5.5483', 'lng' => '95.3238', 'city' => 'Banda Aceh', 'province' => 'Aceh', 'tz' => 'Asia/Jakarta'],
        'Pangkal Pinang' => ['lat' => '-2.1333', 'lng' => '106.1167', 'city' => 'Pangkal Pinang', 'province' => 'Bangka Belitung', 'tz' => 'Asia/Jakarta'],

        // Bali & Nusa Tenggara
        'Denpasar' => ['lat' => '-8.6705', 'lng' => '115.2126', 'city' => 'Denpasar', 'province' => 'Bali', 'tz' => 'Asia/Makassar'],
        'Bali' => ['lat' => '-8.4095', 'lng' => '115.1889', 'city' => 'Bali', 'province' => 'Bali', 'tz' => 'Asia/Makassar'],
        'Mataram' => ['lat' => '-8.5833', 'lng' => '116.1167', 'city' => 'Mataram', 'province' => 'Nusa Tenggara Barat', 'tz' => 'Asia/Makassar'],
        'Kupang' => ['lat' => '-10.1772', 'lng' => '123.6070', 'city' => 'Kupang', 'province' => 'Nusa Tenggara Timur', 'tz' => 'Asia/Makassar'],

        // Kalimantan
        'Balikpapan' => ['lat' => '-1.2379', 'lng' => '116.8289', 'city' => 'Balikpapan', 'province' => 'Kalimantan Timur', 'tz' => 'Asia/Makassar'],
        'Samarinda' => ['lat' => '-0.5021', 'lng' => '117.1537', 'city' => 'Samarinda', 'province' => 'Kalimantan Timur', 'tz' => 'Asia/Makassar'],
        'Banjarmasin' => ['lat' => '-3.3194', 'lng' => '114.5908', 'city' => 'Banjarmasin', 'province' => 'Kalimantan Selatan', 'tz' => 'Asia/Makassar'],
        'Pontianak' => ['lat' => '-0.0263', 'lng' => '109.3425', 'city' => 'Pontianak', 'province' => 'Kalimantan Barat', 'tz' => 'Asia/Jakarta'],
        'Palangkaraya' => ['lat' => '-2.2161', 'lng' => '113.9167', 'city' => 'Palangkaraya', 'province' => 'Kalimantan Tengah', 'tz' => 'Asia/Jakarta'],

        // Sulawesi
        'Makassar' => ['lat' => '-5.1477', 'lng' => '119.4327', 'city' => 'Makassar', 'province' => 'Sulawesi Selatan', 'tz' => 'Asia/Makassar'],
        'Manado' => ['lat' => '1.4748', 'lng' => '124.8428', 'city' => 'Manado', 'province' => 'Sulawesi Utara', 'tz' => 'Asia/Makassar'],
        'Palu' => ['lat' => '-0.9003', 'lng' => '119.8780', 'city' => 'Palu', 'province' => 'Sulawesi Tengah', 'tz' => 'Asia/Makassar'],
        'Kendari' => ['lat' => '-3.9985', 'lng' => '122.5126', 'city' => 'Kendari', 'province' => 'Sulawesi Tenggara', 'tz' => 'Asia/Makassar'],

        // Maluku & Papua
        'Ambon' => ['lat' => '-3.6547', 'lng' => '128.1906', 'city' => 'Ambon', 'province' => 'Maluku', 'tz' => 'Asia/Jayapura'],
        'Jayapura' => ['lat' => '-2.5489', 'lng' => '140.7181', 'city' => 'Jayapura', 'province' => 'Papua', 'tz' => 'Asia/Jayapura'],
        'Sorong' => ['lat' => '-0.8762', 'lng' => '131.2558', 'city' => 'Sorong', 'province' => 'Papua Barat Daya', 'tz' => 'Asia/Jayapura'],
    ];

    /**
     * Indonesian 2-digit postal code prefix mappings to region coordinates.
     *
     * @var array<string, array{lat: string, lng: string, city: string, province: string, tz: string}>
     */
    private const POSTAL_PREFIXES = [
        '35' => ['lat' => '-5.3971', 'lng' => '105.2668', 'city' => 'Bandar Lampung', 'province' => 'Lampung', 'tz' => 'Asia/Jakarta'],
        '10' => ['lat' => '-6.1805', 'lng' => '106.8284', 'city' => 'Jakarta Pusat', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        '11' => ['lat' => '-6.1683', 'lng' => '106.7588', 'city' => 'Jakarta Barat', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        '12' => ['lat' => '-6.2615', 'lng' => '106.8106', 'city' => 'Jakarta Selatan', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        '13' => ['lat' => '-6.2250', 'lng' => '106.9004', 'city' => 'Jakarta Timur', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        '14' => ['lat' => '-6.1384', 'lng' => '106.8640', 'city' => 'Jakarta Utara', 'province' => 'DKI Jakarta', 'tz' => 'Asia/Jakarta'],
        '15' => ['lat' => '-6.1783', 'lng' => '106.6319', 'city' => 'Tangerang', 'province' => 'Banten', 'tz' => 'Asia/Jakarta'],
        '16' => ['lat' => '-6.5971', 'lng' => '106.8060', 'city' => 'Bogor', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        '17' => ['lat' => '-6.2383', 'lng' => '106.9756', 'city' => 'Bekasi', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        '20' => ['lat' => '3.5952', 'lng' => '98.6722', 'city' => 'Medan', 'province' => 'Sumatera Utara', 'tz' => 'Asia/Jakarta'],
        '25' => ['lat' => '-0.9471', 'lng' => '100.4172', 'city' => 'Padang', 'province' => 'Sumatera Barat', 'tz' => 'Asia/Jakarta'],
        '28' => ['lat' => '0.5071', 'lng' => '101.4478', 'city' => 'Pekanbaru', 'province' => 'Riau', 'tz' => 'Asia/Jakarta'],
        '29' => ['lat' => '1.1301', 'lng' => '104.0529', 'city' => 'Batam', 'province' => 'Kepulauan Riau', 'tz' => 'Asia/Jakarta'],
        '30' => ['lat' => '-2.9761', 'lng' => '104.7754', 'city' => 'Palembang', 'province' => 'Sumatera Selatan', 'tz' => 'Asia/Jakarta'],
        '40' => ['lat' => '-6.9175', 'lng' => '107.6191', 'city' => 'Bandung', 'province' => 'Jawa Barat', 'tz' => 'Asia/Jakarta'],
        '50' => ['lat' => '-6.9667', 'lng' => '110.4167', 'city' => 'Semarang', 'province' => 'Jawa Tengah', 'tz' => 'Asia/Jakarta'],
        '55' => ['lat' => '-7.7956', 'lng' => '110.3695', 'city' => 'Yogyakarta', 'province' => 'DI Yogyakarta', 'tz' => 'Asia/Jakarta'],
        '60' => ['lat' => '-7.2575', 'lng' => '112.7521', 'city' => 'Surabaya', 'province' => 'Jawa Timur', 'tz' => 'Asia/Jakarta'],
        '65' => ['lat' => '-7.9666', 'lng' => '112.6326', 'city' => 'Malang', 'province' => 'Jawa Timur', 'tz' => 'Asia/Jakarta'],
        '80' => ['lat' => '-8.6705', 'lng' => '115.2126', 'city' => 'Denpasar', 'province' => 'Bali', 'tz' => 'Asia/Makassar'],
        '90' => ['lat' => '-5.1477', 'lng' => '119.4327', 'city' => 'Makassar', 'province' => 'Sulawesi Selatan', 'tz' => 'Asia/Makassar'],
        '99' => ['lat' => '-2.5489', 'lng' => '140.7181', 'city' => 'Jayapura', 'province' => 'Papua', 'tz' => 'Asia/Jayapura'],
    ];

    /**
     * Find location metadata from text by checking known Indonesian city and district names.
     *
     * @return array{lat: string, lng: string, city: string, province: string, tz: string}|null
     */
    public static function findLocation(string $text): ?array
    {
        foreach (self::LOCATIONS as $name => $data) {
            if (preg_match('/\b'.preg_quote($name, '/').'\b/i', $text)) {
                return $data;
            }
        }

        return null;
    }

    /**
     * Find location metadata using 5-digit Indonesian postal code.
     *
     * @return array{lat: string, lng: string, city: string, province: string, tz: string}|null
     */
    public static function findByPostalCode(string $postalCode): ?array
    {
        $clean = preg_replace('/[^\d]/', '', $postalCode);
        if (strlen($clean) !== 5) {
            return null;
        }

        $prefix = substr($clean, 0, 2);

        return self::POSTAL_PREFIXES[$prefix] ?? null;
    }

    /**
     * Return all registered Indonesian locations.
     *
     * @return array<string, array{lat: string, lng: string, city: string, province: string, tz: string}>
     */
    public static function getAllLocations(): array
    {
        return self::LOCATIONS;
    }
}
