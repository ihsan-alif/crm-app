# Flow Cara Kerja Aplikasi CRM

## Arsitektur

- **Backend**: Go + Gin, PostgreSQL + GORM (multi-tenant — semua data dipisah `tenant_id`)
- **Auth**: JWT access (15 menit) + refresh (7 hari)
- **Frontend**: `Client/` (port 5173)
- **WhatsApp**: Meta Cloud API via `Server/internal/service/whatsapp.go`

## Flow Cara Kerja

### 1. Onboarding & Auth

```
Register -> buat Tenant + User(admin) -> langsung dapat JWT
Login    -> verifikasi email+password -> access + refresh token
Request  -> middleware Auth (parsing JWT) -> inject tenant_id, user_id, role
Guard    -> Role("admin") -> hanya admin bisa lihat daftar user
```

### 2. Manajemen Pelanggan

```
List/CRUD customer -> semua query difilter tenant_id
Import CSV -> parse baris -> validasi (nama+no wajib) -> skip duplikat
Export CSV -> header (nama, no_wa, email, alamat, tag, catatan, sumber)
Search + filter tag + pagination (max 100/baris)
```

### 3. Transaksi

```
Create -> isi items (qty x price) -> total otomatis -> nomor INV-YYYYMMDD-XXXX
Status -> paid/unpaid (revenue hanya dihitung dari status "paid")
Dashboard -> total customers, transactions, revenue, chart 7 hari terakhir
```

### 4. WhatsApp — Kirim Pesan

```
Send -> config dari settings tenant (cek is_active)
      -> normalize phone (08xxx -> 628xxx) -> replace {nama}/{telepon}
      -> POST graph.facebook.com/v21.0/{phone_id}/messages
      -> simpan status sent/failed ke tabel wa_messages (direction=outbound)
```

### 5. WhatsApp — Broadcast

```
Buat draft (target: semua / per tag) -> status "draft"
Send -> status "sending" -> loop semua customer -> kirim satu-satu
     -> selesai: status "sent", hitung total/sent/failed
```

### 6. WhatsApp — Webhook

```
Meta -> GET /webhook/wa?hub.mode&hub.verify_token&hub.challenge  -> balas challenge (verifikasi)
Meta -> POST /webhook/wa  (event messages)
      -> cari tenant via phone_number_id di settings
      -> pesan masuk: auto-create customer (source=whatsapp) + simpan wa_messages (inbound)
      -> status update: update wa_messages status (sent/delivered/read/failed)
```

## Use Case Utama

| Peran | Kebutuhan |
|---|---|
| **Owner / Admin** | Pantau dashboard (revenue, pelanggan, transaksi), kelola seluruh data, lihat semua user |
| **Sales** | CRUD pelanggan, buat transaksi, kirim WA pribadi, broadcast promo, terima chat masuk |
| **System (WhatsApp)** | Terima pesan & status otomatis dari Meta, update data tanpa login |

**Alur nyata**: Pelanggan WA nomor bisnis -> webhook auto-create customer & simpan chat -> sales buka inbox, kirim balasan -> buat transaksi penjualan -> dashboard update revenue.
