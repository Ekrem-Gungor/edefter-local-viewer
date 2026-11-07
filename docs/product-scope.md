# Ürün kapsamı — v1.1.0

Muhasebe ve destek personelinin defter/berat dosyalarını cihaz dışına
aktarmadan incelemesini sağlayan, tek HTML dosyalık çevrimdışı araç.

## Desteklenen işlemler

- Yevmiye ve büyük defter XML'i ile bunların beratları.
- e-Defter sarmalayıcıları ve doğrudan XBRL yapısı; dosya adından bağımsız tanıma.
- Çoklu dosya ve ZIP yükleme, belge listesi ve hatalı dosyaların ayrı raporlanması.
- Taraf, dönem, belge, hesap, muhasebe hareketi ve imza bilgileri.
- Tarih ve fiş alanlarının gerektiğinde üst kayıttan alınması.
- Türkçe arama ve 60 satırlık sayfalama.
- Tüm hareketlerin CSV aktarımı ve yazdırılması.
- Özgün XML indirme ve sınırlı kaynak metin önizlemesi.
- Aynı adlı değişmiş dosyanın güncellenmesi; geçersiz güncellemede öncekinin korunması.

XML 100 MiB, ZIP 150 MiB, toplam XML 300 MiB ve oturum 500 belge ile sınırlıdır.
UTF-8 desteklenir. İç içe ZIP açılmaz. Dosyalar kalıcı tarayıcı deposuna yazılmaz;
sekme yenilendiğinde yeniden yüklenmeleri gerekir.

## Kapsam dışı

Elektronik imza, sertifika zinciri/iptali, zaman damgası, GİB çevrimiçi durum
sorgusu, hukuki geçerlilik veya eksiksiz XML şema doğrulaması yapılmaz. Belge
oluşturma, düzenleme ve GİB'e gönderme işlemleri yoktur. ZIP içindeki belgeler
birbiriyle ilişkilendirilmez veya aynı döneme ait olmaları doğrulanmaz.

## Kabul ölçütleri

Sentetik yevmiye, büyük defter ve beratlar doğru sınıflandırılmalı; eski yalın
XBRL desteği korunmalı. Hatalı girdiler kontrol altında reddedilmeli. ZIP'in
gerçek açılan boyutu sınırlandırılmalı. Arama/sayfalama yazdırma veya CSV'de
satır kaybına yol açmamalı. Testler ve tek HTML build başarılı olmalı; dağıtım
dosyası çevrimdışı açılabilmeli.
