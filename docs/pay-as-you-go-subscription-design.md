# Desain: Model Langganan Pay As You Go (PAYG) & Price Tiering

Sistem langganan CRM Seruwit bertransisi dari model paket dengan limit tetap (*fixed plans* seperti Basic & Pro) ke model **Pay As You Go (PAYG)** yang dinamis berbasis kuota kendaraan terdaftar, dilengkapi dengan sistem **Price Tiering** per unit, serta tetap mempertahankan masa **Trial** bagi semua pengguna baru.

---

## 1. Konsep Utama & Alur Bisnis

Sistem berlangganan dirancang menggunakan model **Prepaid Quota** guna menyesuaikan dengan metode pembayaran transfer manual & Midtrans prabayar:

1. **Masa Trial Otomatis:**
   * Setiap tenant baru yang melakukan registrasi mandiri (*self-serve onboarding*) otomatis mendapatkan plan **Trial** gratis selama **30 hari** dengan kuota uji coba default (misalnya, **50 kendaraan**).
2. **Pembelian Kuota Pertama (Aktivasi):**
   * Setelah masa trial habis, tenant diarahkan ke halaman aktivasi untuk membeli kuota slot kendaraan sesuai kebutuhan (misal: memesan kuota **8 kendaraan**).
   * Biaya berlangganan dihitung di muka (*upfront*) sesuai tiering yang berlaku.
3. **Penggunaan Fleksibel (Dalam Batas Kuota):**
   * Selama jumlah kendaraan terdaftar di workspace masih di bawah kuota (misal: terdaftar 5 kendaraan dari 8 kuota slot), tenant bebas menambah atau menghapus kendaraan secara otomatis tanpa aksi tambahan.
4. **Upgrade Kuota Dinamis:**
   * Jika tenant ingin menambah kendaraan melebihi kuota aktif (misal kendaraan ke-9), sistem akan memblokir pendaftaran baru dan meminta tenant melakukan aksi **Upgrade Kuota** (misal tambah menjadi 12 slot).
   * Sistem menghitung tagihan selisih kuota baru dengan metode proporsional (*pro-rated*) untuk sisa hari aktif bulan berjalan menggunakan harga tiering yang sesuai.

---

## 2. Skema Price Tiering

Sistem menerapkan harga per unit kendaraan secara dinamis tergantung rentang jumlah kendaraan yang dipesan:

| Tier | Rentang Kendaraan | Harga per Unit / Bulan | Contoh Perhitungan |
|------|-------------------|-------------------------|--------------------|
| Tier 1 | 1 – 10 unit | Rp 20.000 / kendaraan | 8 kuota = `8 x Rp 20k = Rp 160.000` |
| Tier 2 | 11 – 50 unit | Rp 15.000 / kendaraan | 25 kuota = `25 x Rp 15k = Rp 375.000` |
| Tier 3 | 51+ unit | Rp 10.000 / kendaraan | 60 kuota = `60 x Rp 10k = Rp 600.000` |

---

## 3. Skema Database (Central Database)

### Tabel Baru: `subscription_tiers`
Tabel ini digunakan untuk menyimpan konfigurasi rentang kuota dan harga per unit secara dinamis.

```sql
CREATE TABLE subscription_tiers (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,          -- e.g., 'Tier 1-10'
    min_vehicles        INTEGER NOT NULL,
    max_vehicles        INTEGER NOT NULL,               -- e.g., 999999 untuk tak terbatas
    price_per_vehicle   DECIMAL(12, 2) NOT NULL,        -- e.g., 20000.00
    created_at          TIMESTAMP NULL,
    updated_at          TIMESTAMP NULL
);
```

### Kolom Baru pada Tabel Existing

```sql
-- Tambahkan kolom kuota terdaftar ke tabel subscriptions central
ALTER TABLE subscriptions ADD COLUMN subscribed_vehicles INTEGER NOT NULL DEFAULT 0;

-- Tambahkan kolom kuota yang dipesan ke tabel payment_orders central
ALTER TABLE payment_orders ADD COLUMN subscribed_vehicles INTEGER NOT NULL DEFAULT 0;
```

---

## 4. Arsitektur Backend

### 4.1 Model: `SubscriptionTier`
* **Lokasi:** `app/Models/SubscriptionTier.php`
* **Fungsi:** Menyimpan konfigurasi tier dan menyediakan helper pencocokan harga.
* **Helper Method:**
```php
public static function calculatePrice(int $vehicles, string $interval = 'month'): float
{
    $tier = self::query()
        ->where('min_vehicles', '<=', $vehicles)
        ->where('max_vehicles', '>=', $vehicles)
        ->first();

    $pricePerUnit = $tier ? (float) $tier->price_per_vehicle : 20000.0;
    $total = $vehicles * $pricePerUnit;

    return $interval === 'year' ? $total * 10 : $total; // Diskon 2 bulan untuk bayar tahunan
}
```

### 4.2 Dinamisasi Limit di Model `Tenant`
* **Lokasi:** `app/Models/Tenant.php`
* **Fungsi:** Menghitung limit kendaraan (`max_vehicles`) secara dinamis berdasarkan status trial atau subscription aktif.
```php
public function planLimit(string $key, mixed $default = null): mixed
{
    if ($key === 'max_vehicles') {
        if ($this->isOnTrial) {
            return 50; // Limit default selama masa trial
        }

        $subscription = $this->subscription;
        if ($subscription && $subscription->isActive()) {
            return (int) $subscription->subscribed_vehicles;
        }

        return 0; // Tidak diizinkan menambah kendaraan jika trial habis & tidak berlangganan
    }

    // Default limits untuk user-defined plans lainnya
    ...
}
```

### 4.3 Integrasi Layanan (Services)

* **`PaymentOrderService::createOrder`**
  Menerima parameter tambahan `subscribed_vehicles`. Menghitung nominal harga menggunakan `SubscriptionTier::calculatePrice($subscribedVehicles, $billingInterval)` dan menyimpannya di `payment_orders.subscribed_vehicles`.

* **`SubscriptionService::activate`**
  Menerima kuota `subscribed_vehicles` dari PaymentOrder terkonfirmasi dan memperbarui record `subscriptions.subscribed_vehicles`.

---

## 5. Alur UI Halaman Langganan (Frontend)

Halaman aktivasi `/module/subscription` akan diperbarui agar menyajikan formulir yang informatif:

1. **Input Kuota Dinamis:** Slider atau input numerik untuk menentukan jumlah kapasitas slot kendaraan yang ingin dipesan (minimal diisi sejumlah kendaraan yang saat ini sudah terdaftar).
2. **Kalkulator Harga Instan:** Menampilkan perkiraan biaya bulanan/tahunan secara *real-time* seiring perubahan input kuota.
3. **Tabel Skema Tiering:** Menampilkan daftar tiering harga agar tenant memahami harga per unit yang berlaku.
4. **Upgrade Form:** Tombol "Upgrade Kuota" yang memicu alur pembayaran proporsional (*pro-rated*) jika kuota kendaraan saat ini ingin ditambah.
