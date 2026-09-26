# Ürün Kapsamı

## Amaç

e-Defter Yerel Görüntüleyici, destek personelinin ve son kullanıcıların e-Defter berat XML dosyalarındaki temel bilgileri ek yazılım kurmadan inceleyebilmesini sağlar.

Ürünün önceliği; kullanım kolaylığı, yerel veri işleme, düşük operasyon maliyeti ve yanlış güven algısı oluşturmayan açık sonuçlardır.

## Hedef kullanıcılar

- Muhasebe ve mali müşavirlik ofisleri
- e-Dönüşüm destek personeli
- Teknik destek ve uygulama danışmanları
- Berat XML içeriğini hızlıca incelemesi gereken son kullanıcılar

## v1.0 kapsamı

- Yerel dosya sistemi üzerinden XML seçimi
- UTF-8 XML içeriğinin tarayıcı içinde okunması
- Yevmiye ve büyük defter berat türlerinin ayrıştırılması
- Mükellef bilgilerinin görüntülenmesi
- Meslek mensubu bilgilerinin görüntülenmesi
- Doküman ve dönem bilgilerinin görüntülenmesi
- Hesap bazında borç ve alacak toplamlarının gösterilmesi
- Ana imza metadatasının görüntülenmesi
- GİB karşı imza metadatasının görüntülenmesi
- Yazdırılabilir görünüm
- Geçersiz ve desteklenmeyen dosyalar için kullanıcı mesajları
- Tek HTML dosyası olarak çevrimdışı kullanım

## Güvenlik ve doğruluk gereksinimleri

- Seçilen dosya istemci cihazından dışarı gönderilmemelidir.
- Harici betik, font, analitik veya API bağımlılığı kullanılmamalıdır.
- XML içinde DTD veya harici varlık tanımı bulunan belgeler reddedilmelidir.
- İşlenebilecek dosya boyutu sınırlandırılmalıdır.
- Belge kökü, namespace değerleri ve desteklenen defter türü doğrulanmalıdır.
- XML kaynaklı tüm metinler kullanıcı arayüzüne güvenli biçimde aktarılmalıdır.
- İmza algoritması sabit yazılmamalı, mevcutsa XML içinden okunmalıdır.
- Tarih ve saat değerlerinde XML içindeki saat dilimi bilgisi korunmalıdır.

## Kapsam dışı

Ürün aşağıdaki işlemleri yapmaz:

- Elektronik imzanın kriptografik doğrulaması
- Sertifika zinciri veya iptal durumu kontrolü
- Belgenin hukuki geçerliliğinin onaylanması
- GİB sistemlerinden çevrimiçi durum sorgulama
- e-Defter oluşturma, düzenleme veya dönüştürme
- GİB'e belge gönderme
- Mali veya hukuki uygunluk denetimi
- XML şema uygunluğunun eksiksiz doğrulanması

## Başarı ölçütleri

v1.0 sürümü aşağıdaki koşullar sağlandığında tamamlanmış kabul edilir:

- Desteklenen sentetik yevmiye ve büyük defter örnekleri doğru görüntülenir.
- Geçersiz, eksik ve desteklenmeyen XML dosyaları kontrollü biçimde reddedilir.
- DTD veya harici varlık içeren XML dosyaları işlenmez.
- Dosya içeriği için herhangi bir ağ isteği oluşmaz.
- Kritik ayrıştırma davranışları otomatik testlerle korunur.
- Dağıtım çıktısı tek bir HTML dosyasıdır.
- README, güvenlik bildirimi ve sürüm notları tamamlanmıştır.
