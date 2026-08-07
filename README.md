# CRM App

Aplikasi CRM multi-tenant untuk manajemen pelanggan, transaksi penjualan, dan integrasi WhatsApp Business. Dibangun dengan arsitektur **Go (Gin + GORM)** untuk backend dan **React (Vite + TailwindCSS)** untuk frontend.

## Fitur

- **Multi-tenant** — seluruh data dipisahkan per `tenant_id`, setiap registrasi otomatis membuat tenant + user admin baru.
- **Pengaturan Toko** — ubah nama toko, unggah logo (ditampilkan di sidebar & nota cetak), dan nonaktifkan tenant (diblokir saat login).
- **Autentikasi JWT** — access token (15 menit) + refresh token (7 hari), role admin/sales.
- **Manajemen Pelanggan** — CRUD, pencarian, filter tag, import & export CSV/Excel (`.xlsx`).
- **Manajemen Produk** — master produk (nama, harga, SKU, kategori, deskripsi), dipakai untuk auto-fill harga saat transaksi.
- **Transaksi Penjualan** — pembuatan transaksi dengan multi item, nomor otomatis `INV-YYYYMMDD-XXXX`, status paid/unpaid.
- **Dashboard** — ringkasan jumlah customer, transaksi, revenue, dan chart 7 hari terakhir.
- **Integrasi WhatsApp Business (Meta Cloud API)**:
  - Kirim pesan personal ke pelanggan (placeholder `{nama}` / `{telepon}`).
  - Broadcast massal ke semua pelanggan atau per tag.
  - Webhook: terima pesan masuk (auto-create customer) & update status pesan.
- **Activity Log** — pencatatan otomatis seluruh aksi penting per tenant.
- **Mode gelap/terang** di frontend.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Go 1.25, Gin, GORM, PostgreSQL 16, JWT, zerolog, bcrypt |
| Frontend | React 18, TypeScript, Vite 5, TailwindCSS 3, Recharts, Axios |
| WhatsApp | Meta Graph API v21.0 (Cloud API) |
| Infra | Docker Compose (PostgreSQL + Server) |

## Struktur Project

```
CRM/
├── docs/
│   └── FLOW.md              # Alur kerja aplikasi secara detail
├── Server/                  # Backend Go
│   ├── cmd/server/          # Entry point (main.go)
│   ├── internal/
│   │   ├── config/          # Konfigurasi dari environment
│   │   ├── handler/         # HTTP handler (controllers)
│   │   ├── middleware/      # Auth JWT, Role, CORS, Logger
│   │   ├── model/           # Definisi struct & tabel
│   │   ├── pkg/             # JWT, hashing, response, errors
│   │   ├── repository/      # Koneksi & migrasi database
│   │   ├── router/          # Registrasi seluruh route
│   │   └── service/         # Business logic
│   ├── migrations/          # SQL migration awal
│   ├── Makefile             # make run / make build
│   └── Dockerfile
├── Client/                  # Frontend React
│   └── src/
│       ├── components/      # Layout, ProtectedRoute
│       ├── context/         # AuthContext, ThemeContext
│       ├── lib/             # Axios client & interceptor
│       ├── pages/           # Login, Register, Dashboard, Customers, dsb.
│       └── types/
├── docker-compose.yml       # PostgreSQL + Server
└── .env.example             # Contoh konfigurasi environment
```

## Prasyarat

- Go 1.23+ (untuk build backend lokal)
- Node.js 18+ & npm (untuk frontend)
- PostgreSQL 16 (atau gunakan Docker)
- Docker & Docker Compose (opsional)

## Menjalankan dengan Docker Compose

1. Salin contoh konfigurasi:

   ```bash
   cp .env.example .env
   ```

2. Sesuaikan nilai di `.env` (wajib mengganti `JWT_SECRET`, `POSTGRES_PASSWORD`, dan `WA_VERIFY_TOKEN`).

3. Jalankan database + server:

   ```bash
   docker compose up --build
   ```

4. Jalankan frontend secara terpisah:

   ```bash
   cd Client
   npm install
   npm run dev
   ```

   Frontend tersedia di `http://localhost:5173` (proxy `/api` ke `http://localhost:8080`), API di `http://localhost:8080`.

## Menjalankan Tanpa Docker

1. Buat database PostgreSQL, lalu salin `Server/.env.example` menjadi `Server/.env` dan sesuaikan.

2. Jalankan server (otomatis membuat database & migrasi saat pertama kali start):

   ```bash
   cd Server
   make run        # atau: go run cmd/server/main.go
   ```

3. Jalankan frontend:

   ```bash
   cd Client
   npm install
   npm run dev
   ```

## Konfigurasi Environment

### Root `.env` (untuk Docker Compose)

| Variabel | Deskripsi |
|---|---|
| `POSTGRES_USER` | User PostgreSQL |
| `POSTGRES_PASSWORD` | Password PostgreSQL |
| `POSTGRES_DB` | Nama database |
| `DB_HOST` | Host database (`db` di dalam Compose) |
| `DB_PORT` | Port database (5432) |
| `DB_SSLMODE` | Mode SSL (disable) |
| `DB_TIME_ZONE` | Zona waktu untuk pelaporan (default `Asia/Jakarta`) |
| `JWT_SECRET` | Secret signing JWT (ganti dengan string acak panjang) |
| `SERVER_PORT` | Port server (8080) |
| `SERVER_ENV` | `development` atau `production` |
| `CORS_ORIGINS` | Origin frontend yang diizinkan, contoh `http://localhost:5173` |

### `Server/.env` (untuk run lokal)

Menambahkan variabel berikut di luar variabel DB di atas:

| Variabel | Deskripsi | Default |
|---|---|---|
| `JWT_ACCESS_EXPIRY` | Durasi access token | `15m` |
| `JWT_REFRESH_EXPIRY` | Durasi refresh token | `168h` |
| `WA_VERIFY_TOKEN` | Token verifikasi webhook WhatsApp | — |

## Autentikasi & Role

- **Register** → otomatis membuat Tenant + User ber-role `admin`, langsung mengembalikan JWT.
- **Login** → memverifikasi email + password (bcrypt), mengembalikan access & refresh token.
- **Role**:
  - `admin` — akses penuh, termasuk daftar semua user.
  - `sales` — akses fitur harian (customer, transaksi, WhatsApp).
- **Refresh Token** — diproses otomatis di frontend via Axios interceptor saat menerima HTTP 401.

## Rate Limiting

Endpoint publik dilindungi rate limiting per IP (in-memory, tanpa dependency tambahan):

| Endpoint | Limit per IP |
|---|---|
| `POST /api/v1/auth/register` | 5 request / 10 menit |
| `POST /api/v1/auth/login` | 10 request / 1 menit |
| `POST /api/v1/auth/refresh` | 30 request / 1 menit |

Saat limit terlampaui, server merespons HTTP `429` dengan kode error `TOO_MANY_REQUESTS`.

## API Endpoint

Semua endpoint (kecuali auth & webhook) membutuhkan header `Authorization: Bearer <access_token>`.

### Auth (Publik)

| Method | Path | Deskripsi |
|---|---|---|
| POST | `/api/v1/auth/register` | Registrasi tenant + admin baru |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Tukar refresh token menjadi access token baru |

### Auth & User (Terproteksi)

| Method | Path | Deskripsi |
|---|---|---|
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/users/me` | Profil user saat ini |
| PUT | `/api/v1/users/me` | Update profil |
| PUT | `/api/v1/users/password` | Ganti password |
| GET | `/api/v1/users` | Daftar user (khusus admin) |
| GET | `/api/v1/tenant` | Info toko/tenant |
| PUT | `/api/v1/tenant` | Update toko: nama, status aktif (khusus admin) |
| POST | `/api/v1/tenant/logo` | Upload logo toko (PNG/JPG/WEBP, maks 2MB) |

### Customers

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/v1/customers` | List (search, filter tag, pagination) |
| GET | `/api/v1/customers/template` | Template import (`?format=csv\|xlsx`) |
| GET | `/api/v1/customers/export` | Export semua pelanggan (`?format=csv\|xlsx`) |
| POST | `/api/v1/customers/import` | Import CSV / Excel (kolom: nama, no_wa, email, alamat, tag, catatan) |
| GET | `/api/v1/customers/:id` | Detail pelanggan |
| POST | `/api/v1/customers` | Tambah pelanggan |
| PUT | `/api/v1/customers/:id` | Update pelanggan |
| DELETE | `/api/v1/customers/:id` | Hapus pelanggan |

### Products

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/v1/products` | List (search, filter kategori, pagination) |
| GET | `/api/v1/products/:id` | Detail produk |
| POST | `/api/v1/products` | Tambah produk |
| PUT | `/api/v1/products/:id` | Update produk |
| DELETE | `/api/v1/products/:id` | Hapus produk |

### Transactions

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/v1/transactions` | List transaksi |
| GET | `/api/v1/transactions/export` | Export transaksi (`?format=csv\|xlsx`) |
| GET | `/api/v1/transactions/:id` | Detail transaksi (termasuk items) |
| POST | `/api/v1/transactions` | Buat transaksi |
| PUT | `/api/v1/transactions/:id` | Update transaksi |
| PUT | `/api/v1/transactions/:id/status` | Ubah status paid/unpaid |
| DELETE | `/api/v1/transactions/:id` | Hapus transaksi |

### Dashboard & Lainnya

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/v1/dashboard` | Statistik & chart |
| GET | `/api/v1/activity-logs` | Daftar activity log |

### WhatsApp

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/v1/wa/config` | Ambil konfigurasi WhatsApp |
| PUT | `/api/v1/wa/config` | Simpan konfigurasi (phone_number_id, token, is_active) |
| POST | `/api/v1/wa/send` | Kirim pesan ke customer |
| GET | `/api/v1/wa/broadcasts` | List broadcast |
| POST | `/api/v1/wa/broadcasts` | Buat draft broadcast |
| POST | `/api/v1/wa/broadcasts/:id/send` | Kirim broadcast |
| GET | `/api/v1/wa/messages` | Riwayat pesan per customer |

### Webhook WhatsApp (Publik)

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/webhook/wa` | Verifikasi endpoint oleh Meta (challenge) |
| POST | `/webhook/wa` | Terima event pesan & status dari Meta |

## Integrasi WhatsApp

1. Buat aplikasi di Meta for Developers, hubungkan WhatsApp Business Account, dan dapatkan **Phone Number ID** + **Token**.
2. Simpan konfigurasi tersebut di halaman **Settings** aplikasi (tersimpan di kolom `settings` tabel `tenants`, key `whatsapp`).
3. Setel webhook di Meta dengan URL `https://<domain>/webhook/wa` dan verify token sesuai `WA_VERIFY_TOKEN`.

**Mekanisme pengiriman pesan:**
- Nomor pelanggan dinormalisasi otomatis (`08xxx` → `628xxx`, spasi/`-`/`+` dihapus).
- Placeholder `{nama}`, `{name}`, `{telepon}`, `{phone}` diganti dengan data customer.
- Pesan dikirim ke `POST graph.facebook.com/v21.0/{phone_id}/messages`.
- Status pengiriman disimpan ke tabel `wa_messages`.

**Webhook (pesan masuk):**
- Meta mengirim event → server mencari tenant via `phone_number_id` di settings.
- Pesan masuk otomatis membuat/menemukan customer (source `whatsapp`) dan menyimpan pesan inbound.
- Event status (`sent`/`delivered`/`read`/`failed`) memperbarui status `wa_messages` terkait.

## Skema Database (Ringkas)

| Tabel | Isi Utama |
|---|---|
| `tenants` | Multi-tenant, settings JSONB (konfigurasi WhatsApp) |
| `users` | User per tenant, role admin/sales, password bcrypt |
| `customers` | Data pelanggan, source (manual/whatsapp) |
| `products` | Master produk (nama, harga, SKU, kategori) |
| `transactions` | Transaksi, nomor unik, total, status paid/unpaid |
| `transaction_items` | Detail item transaksi (nama, qty, price, subtotal) |
| `wa_broadcasts` | Broadcast draft/kirim, counter total/sent/failed |
| `wa_messages` | Riwayat pesan inbound/outbound + status |
| `activity_logs` | Jejak aktivitas per tenant |

Migrasi otomatis dilakukan oleh GORM (`AutoMigrate`) saat server pertama kali dijalankan. Migration SQL awal tersedia di `Server/migrations/`.

## Format Respons API

Semua endpoint mengembalikan format terstandarisasi:

```json
{
  "data": { ... },
  "meta": { "page": 1, "per_page": 100, "total": 5 },
  "error": { "code": "BAD_REQUEST", "message": "...", "details": [] }
}
```

Kode error yang dipakai: `BAD_REQUEST`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`.

## Perintah Umum

| Perintah | Lokasi | Deskripsi |
|---|---|---|
| `make run` | `Server/` | Jalankan backend |
| `make build` | `Server/` | Build binary ke `bin/server` |
| `npm run dev` | `Client/` | Jalankan frontend dev server |
| `npm run build` | `Client/` | Build frontend produksi |
| `docker compose up --build` | root | Jalankan DB + server |

## Dokumentasi Lainnya

- [docs/FLOW.md](docs/FLOW.md) — penjelasan alur kerja aplikasi secara mendalam.
