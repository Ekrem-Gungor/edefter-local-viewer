# e-Defter Yerel Görüntüleyici v1.0.0

İlk kararlı sürüm, e-Defter berat XML dosyalarını herhangi bir sunucuya
yüklemeden incelemek için tek dosyalık çevrimdışı bir araç sunar.

## Çözülen ihtiyaç

Bu ürün, standart görüntüleme bağımlılıkları nedeniyle açılamayan e-Defter
beyanlarının destek sürecinde hızlı ve güvenli biçimde incelenebilmesi için
geliştirildi. İlk çözüm gerçek müşteri ihtiyacına bir iş günü içinde yanıt verdi;
v1.0.0 sürümü bu yaklaşımı güvenli parser, testler, dokümantasyon ve tekrar
üretilebilir build hattıyla ürünleştirir.

## Öne çıkanlar

- Yevmiye ve büyük defter berat desteği
- Tamamen tarayıcı içinde ve çevrimdışı çalışma
- Mükellef, meslek mensubu ve doküman bilgileri
- Hesap bazında borç/alacak toplamları
- İmza ve karşı imza metadata görünümü
- Sürükle-bırak dosya seçimi
- Yazdırmaya uygun kurumsal rapor
- DTD/entity, namespace, belge türü ve dosya boyutu kontrolleri
- Otomatik parser, extractor, arayüz ve tek dosya build testleri

## Kullanım

1. Release ekindeki `EDEFTER_GORUNTULE.html` dosyasını indirin.
2. Dosyayı güncel bir masaüstü tarayıcıda açın.
3. İncelenecek `.xml` dosyasını seçin veya alana sürükleyin.
4. Oluşturulan raporu inceleyin ya da yazdırın.

Kurulum, kullanıcı hesabı, internet bağlantısı ve sunucu gerekmez.

## Sistem gereksinimleri

- Güncel Microsoft Edge, Google Chrome veya Firefox
- JavaScript ve File API desteği
- En fazla 10 MiB büyüklüğünde desteklenen e-Defter berat XML dosyası

## Güvenlik ve gizlilik

Seçilen XML dosyası tarayıcı içinde işlenir. Uygulamada harici API, analiz
servisi, izleme betiği veya dosya yükleme mekanizması bulunmaz.

İndirilen release dosyasının bütünlüğü, release sayfasında yayımlanan SHA-256
özetiyle karşılaştırılmalıdır.

PowerShell ile özet oluşturmak için:

```powershell
Get-FileHash .\EDEFTER_GORUNTULE.html -Algorithm SHA256
```

## Bilinen sınırlar

- Elektronik imzalar kriptografik olarak doğrulanmaz.
- Sertifika geçerliliği ve sertifika zinciri kontrol edilmez.
- Belge bütünlüğü veya hukuki geçerlilik sonucu üretilmez.
- Araç GİB doğrulama servisinin yerine geçmez.
- Desteklenmeyen XML yapıları ve 10 MiB üzerindeki dosyalar reddedilir.

## Geliştirici doğrulaması

```bash
npm ci
npm run test:coverage
npm run build
```

Başarılı build sonucu `dist/EDEFTER_GORUNTULE.html` altında oluşur.
