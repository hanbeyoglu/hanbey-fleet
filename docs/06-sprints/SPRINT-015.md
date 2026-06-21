# Sprint 015 – Driver Portal & End-of-Day Workflow

## 1. Summary

Bu sprint ile Admin Panelinden tamamen bağımsız çalışan **Driver Portal** geliştirilecektir.

Amaç; şoförün günlük operasyonunu tek ekran üzerinden yönetebilmesi ve gün sonunda işletmeye teslim edeceği finansal bilgileri sisteme girmesidir.

Driver kullanıcıları admin paneline erişemeyecek, giriş yaptıktan sonra rol bazlı olarak Driver Portal'a yönlendirilecektir.

Bu sprint sonunda aşağıdaki akış production-ready olacaktır:

- Driver Portal
- Driver Dashboard
- Shift Başlatma
- Gün Sonu Workflow
- Driver Report oluşturma
- Expense oluşturma
- Shift tamamlama
- Timeline entegrasyonu
- Settlement entegrasyonu
- Dashboard entegrasyonu

---

# 2. Driver Portal

Role == DRIVER olan kullanıcılar tamamen farklı bir layout görecektir.

Admin ekranlarına hiçbir şekilde erişemeyecektir.

Göreceği menüler yalnızca:

- Dashboard
- Bugünkü Aracım
- Vardiyam
- Gün Sonu
- Belgelerim
- Bildirimler
- Profilim

Aşağıdaki ekranlara erişim olmayacaktır:

- Dashboard (Admin)
- Vehicles
- Drivers
- Expenses
- Maintenance
- HGS
- Reports
- Scheduler
- Documents
- Settlements
- Analytics

RBAC tamamen backend tarafından enforce edilmelidir.

---

# 3. Driver Dashboard

Dashboard yalnızca Driver'a ait bilgileri gösterecektir.

Gösterilecek bilgiler:

- Bugünkü araç
- Plaka
- Araç markası
- Araç modeli
- Atanma bilgisi
- Shift durumu
- Başlangıç saati
- Aktif süre
- Başlangıç kilometresi (varsa)

Alt tarafta büyük bir buton bulunacaktır.

```
Aracı Teslim Aldım
```

---

# 4. Shift Başlatma

Driver "Aracı Teslim Aldım" butonuna bastığında;

Shift

```
PLANNED

↓

ACTIVE
```

actualStart

```
now()
```

Timeline

```
SHIFT_STARTED
```

oluşturulacaktır.

Vehicle Assignment değişmeyecektir.

Shift ile Assignment birbirine bağlanmayacaktır.

---

# 5. Gün Sonu

Driver yalnızca tek form dolduracaktır.

## Araç Yevmiyesi

Zorunlu.

```
Araç Yevmiyesi *

__________
```

Bu alan;

İşletmeye verilmesi gereken araç ücretidir.

---

## POS

Opsiyonel.

```
POS

__________
```

POS cihazından geçen tutardır.

Bu para doğrudan işletme hesabına geçtiği için teslim edilecek nakitten düşülür.

---

## HGS

Opsiyonel.

```
HGS

__________
```

Şoför gün içerisinde cebinden ödediği HGS tutarını girer.

Bu tutar işletme tarafından şoföre geri ödeneceği için teslim edilecek nakde eklenir.

---

## Giderler

Opsiyonel.

Driver istediği kadar gider ekleyebilir.

Kategori:

- Yakıt
- Otopark
- Araç Yıkama
- Diğer

Her kayıt;

- Kategori
- Tutar
- Not

alanlarından oluşacaktır.

Bu kayıtlar otomatik Expense oluşturacaktır.

---

## Kilometre

Opsiyonel.

Checkbox:

```
☐ Araç kilometresini güncelle
```

İşaretlenirse

```
Güncel KM

__________
```

alanı açılacaktır.

Girildiğinde;

Vehicle.currentMileage

güncellenecektir.

Girilmemesi gün sonunu engellemeyecektir.

---

## Not

Opsiyonel.

```
Not

__________________
```

---

# 6. Canlı Hesaplama

Form doldurulurken ekranın altında otomatik hesaplama gösterilecektir.

Örnek:

Araç Yevmiyesi

5000 ₺

POS

1000 ₺

HGS

400 ₺

Yakıt

250 ₺

Otopark

100 ₺

---

Kasaya Teslim Edilecek

4050 ₺

Formül:

```
cashToDeliver

=

dailyFee

+

declaredHgs

-

posAmount

-

totalExpenses
```

Frontend yalnızca ön izleme yapacaktır.

Gerçek hesap backend tarafından tekrar yapılacaktır.

Frontend hesabına güvenilmeyecektir.

---

# 7. Driver Report

Driver "Gün Sonunu Tamamla" dediğinde;

tek transaction içerisinde;

- DriverReport oluşturulacak / güncellenecek
- Expense kayıtları oluşturulacak
- Shift tamamlanacak
- Timeline oluşturulacak
- Settlement için hazır hale getirilecek

Hiçbir manuel Expense girişi gerekmeyecek.

---

# 8. Expense

Girilen giderler otomatik Expense oluşturacaktır.

Kategori eşleşmeleri:

Yakıt

↓

FUEL

Otopark

↓

PARKING

Araç Yıkama

↓

CLEANING

Diğer

↓

OTHER

---

# 9. Shift Tamamlama

Driver

"Gün Sonunu Tamamla"

dediğinde;

Shift

```
ACTIVE

↓

COMPLETED
```

actualEnd

```
now()
```

Timeline

```
SHIFT_COMPLETED
```

oluşturulacaktır.

---

# 10. Admin Panel

Admin tarafında manuel veri girişi yapılmayacaktır.

Driver'ın gönderdiği bilgiler otomatik olarak aşağıdaki modülleri besleyecektir.

- Driver Reports
- Expenses
- Timeline
- Dashboard
- Settlements

---

# 11. Business Rules

BR-130

Driver admin paneline erişemez.

BR-131

Driver yalnızca kendisine atanmış aktif aracı görebilir.

BR-132

Araç Yevmiyesi zorunludur.

BR-133

POS opsiyoneldir.

BR-134

HGS opsiyoneldir.

BR-135

Kilometre opsiyoneldir.

BR-136

Giderler opsiyoneldir.

BR-137

cashToDeliver backend tarafından hesaplanır.

BR-138

Gün sonu tamamlandığında Shift COMPLETED olur.

BR-139

Expense kayıtları otomatik oluşturulur.

BR-140

Driver yalnızca kendi DriverReport'unu oluşturabilir.

BR-141

Frontend hesaplaması yalnızca ön izlemedir.

BR-142

Backend hesaplaması tek doğru kaynaktır.

---

# 12. Architecture Decisions

- Driver Portal Admin Panelinden tamamen ayrılacaktır.
- Ayrı Layout kullanılacaktır.
- Ayrı Route yapısı kullanılacaktır.
- Controller → Service → Repository → Mapper → DTO mimarisi korunacaktır.
- Prisma modelleri frontend'e expose edilmeyecektir.
- CashToDeliver veritabanında tutulmayacak, runtime hesaplanacaktır.
- Shift ve VehicleAssignment bağımsız aggregate olarak kalacaktır.
- Gün sonu işlemleri tek transaction içerisinde tamamlanacaktır.
- Frontend yalnızca hesaplama ön izlemesi gösterecektir.

---

# 13. API

Yeni endpointler:

```
GET  /driver/me

GET  /driver/dashboard

POST /driver/shift/start

GET  /driver/end-of-day

POST /driver/end-of-day

GET  /driver/documents

GET  /driver/notifications
```

Admin endpointlerinden tamamen ayrılacaktır.

---

# 14. Admin Entegrasyonu

Driver'ın gönderdiği bilgiler otomatik olarak aşağıdaki ekranlara yansıyacaktır.

- Dashboard
- Driver Reports
- Expenses
- Timeline
- Settlements

Ek bir manuel işlem gerekmeyecektir.

---

# 15. UI

Driver Portal modern mobil uyumlu olacaktır.

Ana ekran:

- Bugünkü Araç
- Shift Durumu
- Aktif Süre
- Büyük "Aracı Teslim Aldım" butonu

Gün Sonu ekranı:

- Araç Yevmiyesi
- POS
- HGS
- Giderler
- Kilometre
- Not
- Canlı "Kasaya Teslim Edilecek" kartı
- Gün Sonunu Tamamla butonu

---

# 16. Verification Checklist

- pnpm build başarılı olmalı.
- Prisma migration gerekmiyorsa yeni migration oluşturulmamalı.
- Swagger endpointleri görünmeli.
- Driver admin ekranına erişememeli.
- Driver yalnızca kendi verilerini görebilmeli.
- Shift Start çalışmalı.
- Shift Complete çalışmalı.
- Driver Report oluşmalı.
- Expense kayıtları oluşmalı.
- Timeline kayıtları oluşmalı.
- Dashboard güncellenmeli.
- Settlement verileri oluşmalı.
- CashToDeliver backend ile doğru hesaplanmalı.
- Admin paneli otomatik güncellenmeli.

---

# Sprint Readiness Score

**10 / 10**

Bu sprint tamamlandığında sistem ilk kez gerçek bir taksi filosunda günlük operasyonu uçtan uca yönetebilecek seviyeye ulaşacaktır.

Driver yalnızca tek ekran üzerinden veri girecek, sistem Driver Report, Expense, Timeline, Dashboard ve Settlement modüllerini otomatik besleyecek, Owner/Admin tarafında manuel veri girişi ihtiyacı ortadan kalkacaktır.
