Sprint 017 – Fleet Isolation & Multi-Tenant Enforcement

Bu sprint bir GÜVENLİK ve MULTI-TENANCY sprintidir.

Yeni ürün özelliği eklenmedi.

⸻

AMAÇ

Sprint 016'da FleetOwner ve fleetOwnerId tanıtıldı; bu sprintte tam filo izolasyonu backend ve frontend genelinde uygulandı.

⸻

TEMEL KURAL

- OWNER, MANAGER, ACCOUNTANT → yalnızca seçili fleetOwnerId verisine erişir
- SUPER_ADMIN → tüm filolara erişir, isteğe bağlı fleetOwnerId filtresi
- DRIVER → üyelik ve seçili filo kapsamında Driver Portal

⸻

BACKEND

- FleetScopeService, FleetScopeGuard, fleet-scope.util
- JWT strategy fleetOwnerId aktarımı
- Tüm fleet-scoped modüllerde controller → service → repository filtreleme
- POST /auth/clear-fleet — SUPER_ADMIN global mod

⸻

FRONTEND

Admin:
- Çoklu üyelikte /select-fleet zorunlu
- Tek üyelikte otomatik select-fleet
- Layout'ta aktif filo adı ve filo değiştirme
- SUPER_ADMIN global mod

Driver:
- Çoklu filoda filo seçimi
- Scoped token ile tüm portal istekleri

⸻

DOĞRULAMA

pnpm build
prisma migrate reset --force
prisma generate
prisma db seed
application startup
Swagger loads

⸻

TESLİM RAPORU

Sprint sonunda agent raporu üretilir.
