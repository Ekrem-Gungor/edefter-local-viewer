# Değişiklik Günlüğü

Bu projedeki önemli değişiklikler bu dosyada belgelenir.

Biçim [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) yaklaşımını,
sürüm numaraları ise [Semantic Versioning](https://semver.org/) kurallarını
izler.

## [Unreleased]

## [1.1.0] - 2026-11-07

### Eklendi

- Gerçek yevmiye/büyük defter XML'leri ve e-Defter kök sarmalayıcıları.
- Çoklu XML/ZIP yükleme, belge listesi, hareket arama ve sayfalama.
- CSV aktarımı, kaynak XML önizlemesi ve özgün XML indirme.
- XML 100 MiB, ZIP 150 MiB, toplam XML 300 MiB ve 500 belge sınırları.
- Gerçek açılan ZIP boyutuna uygulanan akış sınırı.

### Düzeltildi

- Yazdırmada sayfaya sığan bilgi kartlarının, tablo satırlarının ve imza bloklarının birlikte tutulması.
- Yazdırmada grid ve taşma kurallarının kaldırılması; uzun tabloların başlıkları tekrarlanarak devam etmesi.
- Kaynak XML bölümünün başlığı dahil tamamının baskıdan gizlenmesi.

- Yazdırmanın seçili belgenin tüm hareketlerini içermesi ve arama/sayfanın geri yüklenmesi.
- Hareket tarih/fiş bilgilerinin üst kayıttan güvenli devralınması.
- Aynı adlı değişmiş belgenin güncellenmesi, hatalı güncellemede eski belgenin korunması.
- Berat özet toplamlarının yalnızca period_change kayıtlarından alınması.
- Paket sürümünün 1.1.0 olarak dokümantasyonla eşitlenmesi.

### Değişti

- Kaynak kod XML, veri çıkarımı, içe aktarma, arayüz, uygulama ve dışa aktarma katmanlarına ayrıldı.
- Geliştirme için en düşük Node.js sürümü 22.22.2 oldu.

## [1.0.0] - 2026-09-26

### Eklendi

- Yevmiye ve büyük defter berat XML dosyaları için çevrimdışı görüntüleme.
- Mükellef, meslek mensubu ve doküman bilgilerinin raporlanması.
- Hesap bazında borç ve alacak toplamlarının gösterilmesi.
- Belge imzası ve karşı imza metadata alanlarının görüntülenmesi.
- Sürükle-bırak ve dosya seçici üzerinden yerel XML yükleme.
- Yazdırmaya uygun, sade ve kurumsal rapor arayüzü.
- Tek HTML dosyası üreten Vite tabanlı build hattı.
- Sentetik XML fixture'larıyla parser, extractor, arayüz ve build testleri.
- GitHub Actions üzerinde otomatik test, coverage ve release build kontrolü.

### Güvenlik

- XML kaynaklarında DTD ve entity kullanımının reddedilmesi.
- Dosya boyutunun varsayılan olarak 10 MiB ile sınırlandırılması.
- XBRL kök elementi, namespace ve desteklenen belge türü doğrulaması.
- XML kaynaklı değerlerin HTML olarak çalıştırılmadan güvenli DOM API'leriyle
  görüntülenmesi.
- Dosyaların herhangi bir sunucuya gönderilmeden tarayıcı içinde işlenmesi.

### Sınırlar

- Elektronik imza, sertifika zinciri ve belge bütünlüğü için kriptografik
  doğrulama yapılmaz.
- Araç resmi GİB doğrulaması veya hukuki geçerlilik sonucu üretmez.

[Unreleased]: https://github.com/Ekrem-Gungor/edefter-local-viewer/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Ekrem-Gungor/edefter-local-viewer/releases/tag/v1.1.0
[1.0.0]: https://github.com/Ekrem-Gungor/edefter-local-viewer/releases/tag/v1.0.0
