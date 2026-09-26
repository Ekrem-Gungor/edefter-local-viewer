# v1.0.0 Release Kontrol Listesi

## Kaynak kod

- [ ] Feature branch güncel `main` üzerine kurulmuş durumda.
- [ ] Çalışma dizini temiz.
- [ ] Gerçek müşteri verisi veya kişisel veri depoda bulunmuyor.
- [ ] Geçici patch, log, coverage ve build dosyaları commit kapsamı dışında.

## Kalite kontrolleri

- [ ] `npm ci` başarılı.
- [ ] `npm run test:coverage` başarılı.
- [ ] `npm run build` başarılı.
- [ ] `git diff --check` temiz.
- [ ] GitHub Actions CI kontrolü başarılı.

## Manuel doğrulama

- [ ] Sentetik yevmiye XML'i doğru görüntüleniyor.
- [ ] Sentetik büyük defter XML'i doğru görüntüleniyor.
- [ ] Sürükle-bırak ve dosya seçici çalışıyor.
- [ ] Hatalı, boş ve desteklenmeyen XML için anlaşılır hata gösteriliyor.
- [ ] 10 MiB üzerindeki dosya reddediliyor.
- [ ] Temizle ve Yazdır işlemleri çalışıyor.
- [ ] Dar ekran ve yazdırma görünümü kontrol edildi.
- [ ] Tarayıcı geliştirici araçlarında harici ağ isteği görülmüyor.

## Dokümantasyon

- [ ] README güncel özellikleri ve kullanım adımlarını içeriyor.
- [ ] Güvenlik ve kriptografik doğrulama sınırları açıkça belirtiliyor.
- [ ] Mimari doküman güncel.
- [ ] Changelog ve release notları hazır.
- [ ] Gerçek veri içermeyen güncel ekran görüntüsü eklendi.

## Yayın

- [ ] Pull request onaylandı ve `main` branch'e birleştirildi.
- [ ] `main` üzerinde son CI başarılı.
- [ ] Temiz `main` üzerinden production build alındı.
- [ ] `EDEFTER_GORUNTULE.html` için SHA-256 özeti oluşturuldu.
- [ ] Annotated `v1.0.0` etiketi oluşturuldu ve push edildi.
- [ ] GitHub Release oluşturuldu.
- [ ] HTML dosyası release eki olarak yüklendi.
- [ ] SHA-256 özeti release açıklamasına eklendi.
- [ ] Release indirilerek son smoke test gerçekleştirildi.
