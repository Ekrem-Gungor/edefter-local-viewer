# e-Defter Yerel Görüntüleyici

e-Defter berat XML dosyalarını herhangi bir sunucuya yüklemeden, doğrudan tarayıcı içinde görüntüleyen çevrimdışı bir araçtır.

Bu proje, gerçek bir müşteri ortamında açılamayan e-Defter beyanlarını inceleyebilmek için tek iş günü içinde geliştirilen çözümün güvenli, dokümante edilmiş ve sürdürülebilir sürümüdür.

## Temel özellikler

- Yevmiye ve büyük defter berat XML dosyalarını yerel olarak okur.
- Mükellef, meslek mensubu ve doküman bilgilerini gösterir.
- Hesapların borç ve alacak toplamlarını listeler.
- XML içindeki elektronik imza ve GİB karşı imza metadatasını görüntüler.
- Yazdırılabilir bir rapor oluşturur.
- Kurulum, internet bağlantısı veya sunucu gerektirmez.
- Seçilen dosyayı ağ üzerinden herhangi bir sisteme göndermez.

## Gizlilik yaklaşımı

Dosya işleme işlemi kullanıcının tarayıcısında gerçekleşir. Uygulamanın mevcut sürümünde harici API çağrısı, analiz servisi, izleme betiği veya veri yükleme mekanizması bulunmaz.

Gerçek müşteri verileri depoya, hata bildirimlerine veya ekran görüntülerine eklenmemelidir. Test verileri sentetik ya da geri döndürülemeyecek şekilde anonimleştirilmiş olmalıdır.

## Kullanım

1. `EDEFTER_GORUNTULE.html` dosyasını güncel bir masaüstü tarayıcıda açın.
2. **XML Seç** düğmesiyle desteklenen bir berat XML dosyası seçin.
3. Görüntülenen bilgileri inceleyin veya tarayıcının yazdırma özelliğini kullanın.

## Desteklenen kapsam

İlk sürümün hedefi, GİB e-Defter yapısındaki yevmiye ve büyük defter berat XML dosyalarını okunabilir hale getirmektir. Ayrıntılı kapsam ve kapsam dışı maddeler [ürün kapsamı belgesinde](docs/product-scope.md) açıklanmıştır.

## Önemli uyarı

Bu araç XML içindeki imza ve karşı imza alanlarını yalnızca görüntüler. Elektronik imzaların kriptografik doğruluğunu, sertifika geçerliliğini, belgenin bütünlüğünü veya hukuki geçerliliğini doğrulamaz. GİB onay servisi yerine geçmez ve resmi doğrulama sonucu üretmez.

## Proje durumu

Proje şu anda ilk çalışan prototipten ürünleştirilmiş v1.0 sürümüne geçiş aşamasındadır. Başlangıç prototipi Git geçmişinde korunmaktadır.

Planlanan çalışmalar:

- XML güvenlik ve dosya boyutu kontrolleri
- Belge türü ve namespace doğrulaması
- İmza algoritmasının XML içeriğinden okunması
- Hata mesajlarının ve erişilebilirliğin iyileştirilmesi
- Sürükle-bırak dosya seçimi
- Sentetik test dosyaları ve otomatik testler
- Tek HTML dosyalı sürüm paketi

## Güvenlik

Bir güvenlik problemi bildirmek için [SECURITY.md](SECURITY.md) dosyasındaki yönergeleri izleyin.

## Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.
