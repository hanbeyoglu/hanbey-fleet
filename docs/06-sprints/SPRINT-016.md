Sprint 016 – Fleet Owner Foundation

Bu sprint, projenin bugüne kadarki en büyük mimari dönüşümüdür.

ÖNEMLİ KURALLAR

- Mevcut Sprint 001–015 mimarisini bozma.
- Controller → Service → Repository → Mapper → DTO yapısını koru.
- Business rule yalnızca Service katmanında olacak.
- Repository sadece persistence içerecek.
- Prisma modelleri hiçbir yerde dışarı expose edilmeyecek.
- Tüm endpointler DTO dönecek.
- Transaction kullanılan yerlerde mevcut mimari korunacak.
- Timeline üretimi mevcut standartta devam edecek.
- Backward compatibility mümkün olduğunca korunacak.

====================================================
AMAÇ
====================================================

Sistem artık tek araç sahibi mantığından çıkarılıp gerçek SaaS altyapısına hazırlanacak.

Yeni hiyerarşi:

SUPER_ADMIN
↓
Fleet Owner
↓
Users
Vehicles
Drivers
Assignments
Reports
Documents
Notifications
Expenses
Maintenance
Settlements

Her Fleet Owner yalnızca kendi verilerini görebilecek.

====================================================
FLEET OWNER
====================================================

Yeni aggregate:

FleetOwner

Alanlar:

- id
- name
- phone
- email
- address
- taxNumber
- createdAt
- updatedAt
- deletedAt

Soft delete desteklenecek.

====================================================
FLEET MEMBERSHIP
====================================================

Yeni aggregate:

FleetMembership

Alanlar:

- id
- fleetOwnerId
- userId
- role
- status
- createdAt

Status:

ACTIVE
INACTIVE

Bu tablo kullanıcı ile filo arasındaki ilişkiyi yönetecek.

====================================================
USER
====================================================

Telefon numarası artık sistem genelinde UNIQUE olacak.

Telefon kullanıcı kimliği olacak.

Aynı telefon numarası ile ikinci kullanıcı oluşturulamayacak.

====================================================
ROLLER
====================================================

Roller:

SUPER_ADMIN

OWNER

MANAGER

ACCOUNTANT

DRIVER

====================================================
ARAÇ
====================================================

Vehicle artık FleetOwner'a bağlı olacak.

vehicle.fleetOwnerId zorunlu.

Araç eklerken:

Araç Sahibi

↓

Yeni oluştur

veya

Mevcut kullanıcıya bağla

====================================================
ARAÇ SAHİBİ OLUŞTURMA
====================================================

Telefon aranacak.

Telefon varsa:

Yeni kullanıcı oluşturulmayacak.

Mevcut kullanıcı Fleet Owner olarak kullanılacak.

Telefon yoksa:

User

FleetOwner

FleetMembership

tek transaction içinde oluşturulacak.

====================================================
ŞOFÖR
====================================================

Şoför eklerken de aynı mantık.

Telefon aranacak.

Telefon varsa:

Yeni User oluşturulmayacak.

Var olan kullanıcı kullanılacak.

FleetMembership oluşturulacak.

====================================================
ÇOKLU FİLO
====================================================

Bir şoför aynı anda birden fazla filoda bulunabilir.

Örnek:

Ali

↓

Fleet A

ACTIVE

↓

Fleet B

ACTIVE

Login sonrası:

Önce filo seçilecek.

Daha sonra o filoya ait araçlar listelenecek.

====================================================
DRIVER PORTAL
====================================================

Driver login

↓

Telefon

↓

Şifre

↓

Fleet seçimi

↓

Araç seçimi

↓

Shift başlat

↓

Gün sonu

====================================================
ADMIN
====================================================

SUPER_ADMIN

Tüm filoları görebilir.

OWNER

Sadece kendi filosunu görebilir.

MANAGER

Kendi filosunu yönetebilir.

ACCOUNTANT

Sadece finans ekranlarını görebilir.

====================================================
GÜVENLİK
====================================================

Tüm sorgular fleetOwnerId ile scope edilecek.

Dashboard

Vehicles

Drivers

Assignments

Expenses

Maintenance

Timeline

Reports

Settlements

Notifications

Documents

Imports

Scheduler

Hiçbiri başka filonun verisini döndürmeyecek.

====================================================
ADMIN UI
====================================================

Fleet Owner yönetim ekranı oluştur.

Araç oluştururken Fleet Owner seçimi ekle.

Şoför oluştururken:

Telefon ara

↓

Bulunduysa

Mevcut kullanıcıyı bağla

↓

Bulunamadıysa

Yeni oluştur.

====================================================
DRIVER UI
====================================================

Birden fazla filoda üyeliği varsa:

Fleet Selection ekranı.

Birden fazla araç atanmışsa:

Vehicle Selection ekranı.

Sonrasında Dashboard.

====================================================
SEED
====================================================

Seed oluştur:

SUPER_ADMIN

Fleet Owner A

Fleet Owner B

Manager

Accountant

Driver

Shared Driver (iki filoya da üye)

Araçlar

Assignmentlar

====================================================
DOĞRULAMA
====================================================

Çalıştır:

pnpm build

prisma migrate reset --force

prisma generate

prisma db seed

Doğrula:

✓ SUPER_ADMIN tüm filoları görüyor

✓ OWNER sadece kendi filosunu görüyor

✓ DRIVER yalnızca üyesi olduğu filoları görüyor

✓ Aynı telefon ile ikinci kullanıcı oluşturulamıyor

✓ Aynı şoför iki farklı filoda kullanılabiliyor

✓ Araç oluştururken mevcut Fleet Owner seçilebiliyor

✓ Şoför oluştururken telefon ile mevcut kullanıcı bulunabiliyor

✓ Driver Portal filo seçimi çalışıyor

✓ Driver Portal araç seçimi çalışıyor

====================================================
TESLİM RAPORU
====================================================

Sprint sonunda aşağıdaki formatta rapor ver:

1. Summary

2. Changed Files

3. Architecture Decisions

4. Migration Details

5. Business Rules Implemented

6. Security Model

7. Verification Results

8. Remaining Technical Debt

Kod yazarken mevcut modülleri bozma, mevcut sprintlerin davranışını koru ve yeni mimariyi üzerine inşa et.
