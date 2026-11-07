# e-Defter Yerel Görüntüleyici v1.1.0

## Yenilikler

- Berat görüntülemesine ek olarak gerçek yevmiye ve büyük defter XML desteği.
- `edefter:defter`, `edefter:berat` ve doğrudan XBRL yapılarından belge türü belirleme.
- Birden fazla XML/ZIP açma ve yüklenen belgeler arasında geçiş.
- Hareket tablosu, Türkçe arama, sayfalama ve tüm hareketlerin CSV aktarımı.
- Kaynak XML önizlemesi ve özgün dosyanın indirilmesi.
- XML 100 MiB, ZIP 150 MiB, toplam XML 300 MiB ve 500 belge sınırları.
- Gömülü JSZip 3.10.1 ile internet gerektirmeyen arşiv desteği.

## Düzeltmeler

- Yazdırma ekran sayfasıyla sınırlı kalmaz; seçili belgenin tüm hareketlerini içerir.
- Tarih ve fiş bilgisi gerekirse hareketin ait olduğu üst kayıttan okunur.
- Aynı adlı değişen dosya listedeki belgeyi günceller; hatalı güncelleme eski belgeyi silmez.
- Berat özeti ve tam defter toplamları açıkça ayrılır.
- `package.json` ve lockfile sürümü 1.1.0 ile eşitlenir.
- README, mimari, kapsam ve güvenlik belgeleri yeni özelliklerle güncellenir.

## Yazdırma düzeni

Sayfaya sığan bilgi kartları ve imza blokları birlikte tutulur. Uzun tablolar
satır sınırlarından bölünür ve sütun başlıkları sonraki sayfalarda tekrarlanır.
Kaynak XML bölümü başlığı dahil baskıdan çıkarılır. Tek başına bir sayfadan
uzun olan bir kart veya satır için tarayıcı bölmeme isteğini gevşetebilir.

Önerilen ayarlar: A4, dikey, ölçek %100; tarayıcının üstbilgi/altbilgileri kapalı.
Tarayıcı, yazıcı ve seçilen ölçek nihai sayfa sayısını etkileyebilir.

## Doğrulama ve kullanım sınırı

İmza/karşı imza bilgilerinin bulunması doğrulama veya GİB onayı anlamına gelmez.
UTF-8 XML desteklenir. Büyük belgeler ve tüm hareketlerin yazdırılması cihaz
kaynaklarına bağlıdır. CSV seçili belgenin tüm hareketlerini içerir, arama
filtresine bağlı değildir. Testlerde gerçek müşteri verisi kullanılmaz.

## Yayın

Temiz kaynak üzerinden `npm ci`, `npm run test:coverage` ve `npm run build`
çalıştırın. `dist/EDEFTER_GORUNTULE.html` dosyasını üç hedef tarayıcıda test edin.
HTML için SHA-256 oluşturup `v1.1.0` GitHub Release ekine yükleyin. Bu doküman
kaynak hazırlığına aittir; etiket ve yayın ayrıca gerçekleştirilir.
