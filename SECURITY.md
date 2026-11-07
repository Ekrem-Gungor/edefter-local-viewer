# Güvenlik Politikası

## Desteklenen sürümler

Güvenlik düzeltmeleri varsayılan daldaki güncel kod üzerinde sağlanır. v1.1.0 hazırlığında güncel kaynak kullanın; eski dağıtım HTML dosyaları otomatik güncellenmez.

## Güvenlik açığı bildirimi

Bir güvenlik açığı tespit ederseniz herkese açık bir GitHub Issue açmayın. Deponun **Security** sekmesindeki **Report a vulnerability** seçeneğini kullanarak özel güvenlik bildirimi oluşturun.

Bildirimde mümkünse şu bilgilere yer verin:

- Etkilenen sürüm veya commit
- Problemin yeniden üretim adımları
- Beklenen ve gözlenen davranış
- Olası etki
- Kişisel veri içermeyen örnek dosya veya en küçük yeniden üretim senaryosu

## Hassas veri politikası

Bu araç mali ve kimlik bilgileri içerebilen e-Defter dosyalarıyla çalışır.

Aşağıdaki verileri depoya, Issue kayıtlarına, pull request açıklamalarına veya ekran görüntülerine eklemeyin:

- Gerçek VKN veya TCKN
- Mükellef ya da meslek mensubu isimleri
- Telefon, e-posta ve adres bilgileri
- ETTN ve belge tekil numaraları
- Sertifika seri numaraları
- SignatureValue, DigestValue veya sertifika içeriği
- Gerçek muhasebe hesap hareketleri

Testlerde yalnızca sentetik veya geri döndürülemeyecek şekilde anonimleştirilmiş veriler kullanılmalıdır.

## Güvenlik sınırı

Uygulama XML içindeki imza alanlarını görüntüler; kriptografik imza doğrulaması yapmaz. Görüntülenen bir karşı imzanın varlığı belgenin geçerli, değiştirilmemiş veya resmi olarak onaylanmış olduğunu tek başına kanıtlamaz.

## v1.1.0 içe aktarma sınırları

XML dosyası 100 MiB, ZIP dosyası 150 MiB, toplam XML verisi 300 MiB ve oturum
500 belge ile sınırlıdır. ZIP başlık bilgisine ek olarak açılan gerçek byte
sayısı da kontrol edilir. İçe aktarma sırayla yürütülür. İç içe arşivler açılmaz.
Dosyalar UTF-8 olarak okunur. CSV'de formül başlangıcına benzeyen metinler
etkisizleştirilir. Orijinal XML indirme özgün byte dizisini kullanır.
