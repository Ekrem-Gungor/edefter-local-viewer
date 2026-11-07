# Mimari

Uygulama Vanilla JavaScript modülleri ve Vite ile geliştirilir. Dağıtım tek
`EDEFTER_GORUNTULE.html` dosyasıdır; internet, sunucu ve veritabanı gerekmez.

## Dosya işleme

1. `src/app/createViewer.js` seçici ve sürükle-bırak olaylarını aynı akışa bağlar.
2. `src/import/documentStore.js` XML/ZIP dosyalarını sırayla okur. XML 100 MiB,
   ZIP 150 MiB, toplam XML 300 MiB ve oturum 500 belge ile sınırlıdır.
3. ZIP girdileri gömülü JSZip ile açılır. Başlıktaki boyut kontrolüne ek olarak
   gerçek açılan byte sayısı akış sırasında sınırlandırılır.
4. Dosya UTF-8 olarak çözümlenir; özgün byte dizisi indirme için saklanır.
5. `src/xml` DTD/entity bildirimlerini reddeder; XML sözdizimi, kök ve belge
   türünü kontrol eder. Dosya adı belge türünü etkilemez.
6. `src/parser` görüntüleme modelini çıkarır. Hareket alanında değer yoksa
   yalnızca ait olduğu `entryHeader` üzerindeki doğrudan alanlara bakılır;
   kardeş hareketlerden veri alınmaz.
7. `src/ui` XML metinlerini `textContent` ile görüntüler.

Doğrudan XBRL belgelerinde eski yalın yapı da kabul edilir. `period_change`
özetlerinden oluşan yalın belgeler berat olarak sınıflandırılır; sarmalanmış
belgelerde `edefter:defter` / `edefter:berat` kökü esas alınır. Berat hesap
özetine yalnızca `period_change` kayıtları dahil edilir.

## Güncelleme ve durum

Belge anahtarı XML adı ile ZIP kaynağı/yolundan oluşur. Aynı anahtar ve aynı
byte içeriği tekrar eklenmez. İçerik değişmişse yeni belge önce ayrıştırılır,
başarılıysa aynı listedeki eski belgenin yerine alınır. Boyut hesabında eski
belge düşülür. Hatalı güncelleme eski belgeyi ve raporu korur.

Seçili belge, arama, sayfa ve işlem kilidi uygulama katmanındadır. İçe aktarma
sırasında eş zamanlı ikinci yükleme ve temizleme engellenir. ZIP'teki hatalı
XML diğer belgelerin açılmasını engellemez.

## Yazdırma ve dışa aktarma

Ekranda 60 satırlık sayfalama vardır. Yazdırma düğmesi ve tarayıcının
`beforeprint` olayı tüm hareketleri tabloya hazırlar. `afterprint` mevcut
aramayı ve sayfayı geri yükler. Yazdırma seçili belgenin tüm hareketlerini
kapsar; filtrelenmiş sayfayla sınırlı değildir.

CSV de tüm hareketleri içerir; formül başlangıcına benzeyen metinler
etkisizleştirilir. Kaynak XML indirmesi, XML'i yeniden serialize etmek yerine
özgün byte dizisini kullanır. Kaynak önizlemesi 80.000 karakterle sınırlıdır.

## Build

Vite JSZip ve uygulamayı paketler. `scripts/build-single-file.mjs` JavaScript,
CSS ve üçüncü taraf bildirimlerini tek HTML'e gömer. Build testi harici script
ve stil dosyası kalmadığını kontrol eder. Çalışma anında harici ağ kaynağı yoktur.

## Sınırlar

XML ayrıştırma ve rapor oluşturma ana tarayıcı iş parçacığında gerçekleşir.
Sayfalama DOM satırlarını sınırlar, XML'in tamamının ayrıştırılmasını ortadan
kaldırmaz. Büyük dosya ve tüm hareketlerin yazdırılması cihaz kaynaklarına
bağlıdır. İmza ve karşı imza yalnızca metadata olarak okunur; kriptografik,
sertifika, hukuki geçerlilik veya eksiksiz XSD doğrulaması yapılmaz.
