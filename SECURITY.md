# Güvenlik Politikası

## Desteklenen sürümler

Proje kararlı bir sürüme ulaşana kadar yalnızca varsayılan daldaki en güncel kod için güvenlik düzeltmesi sağlanır. İlk kararlı sürümden sonra desteklenen sürümler bu belgede ayrıca listelenecektir.

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
