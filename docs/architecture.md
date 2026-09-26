# Mimari

## Amaç

e-Defter Yerel Görüntüleyici, destek personelinin yevmiye ve büyük defter
beratlarını harici bir sisteme yüklemeden inceleyebilmesi için tasarlanmış,
tarayıcı tabanlı ve çevrimdışı çalışan bir araçtır.

Uygulama çalışma zamanında yalnızca tek bir HTML dosyasına ihtiyaç duyar.
Sunucu, veritabanı, kullanıcı hesabı veya internet bağlantısı gerektirmez.

## Çalışma zamanı akışı

1. Kullanıcı `.xml` dosyasını seçer veya sürükleyip bırakır.
2. Dosya uzantısı ve 10 MiB boyut sınırı kontrol edilir.
3. XML metni tarayıcının File API'si ile yerel olarak okunur.
4. Güvenli parser, DTD ve entity tanımlarını reddeder.
5. XBRL kök elementi, namespace ve belge türü doğrulanır.
6. Görüntüleme modeli XML namespace'leri üzerinden çıkarılır.
7. Değerler `textContent` ve güvenli DOM API'leriyle rapora aktarılır.
8. Kullanıcı raporu ekranda inceler veya tarayıcı üzerinden yazdırır.

Bu akışta seçilen dosya için herhangi bir ağ isteği oluşturulmaz.

## Bileşenler

| Bileşen | Sorumluluk |
| --- | --- |
| `src/xml` | XML güvenlik kontrolleri, ayrıştırma ve belge türü doğrulaması |
| `src/parser` | XML belgesinden görüntüleme modelinin çıkarılması |
| `src/ui` | Modelin güvenli DOM işlemleriyle rapora dönüştürülmesi |
| `src/main.js` | Dosya seçimi, kullanıcı akışı ve hata yönetimi |
| `scripts` | Vite çıktısının tek HTML dosyasına dönüştürülmesi |
| `tests/fixtures` | Gerçek müşteri verisi içermeyen sentetik XML örnekleri |
| `tests` | Parser, extractor, arayüz ve build davranış testleri |

## Güvenlik sınırı

XML dosyası güvenilmeyen girdi olarak kabul edilir. Bu nedenle:

- DTD ve entity içeren XML kaynakları işlenmez.
- Beklenmeyen kök element ve namespace değerleri reddedilir.
- Yalnızca desteklenen `journal` ve `ledger` belge türleri kabul edilir.
- XML değerleri `innerHTML` üzerinden sayfaya yazılmaz.
- Dosya boyutu tarayıcıda okunmadan önce kontrol edilir.
- Testlerde yalnızca sentetik veriler kullanılır.

Bu önlemler uygulamanın saldırı yüzeyini azaltır; ancak aracı bir elektronik
imza doğrulama ürünü haline getirmez.

## İmza bilgilerinin anlamı

Uygulama XML içinde bulunan aşağıdaki alanları görüntüler:

- imzalayan bilgisi,
- imza zamanı,
- imza ve özet algoritması,
- sertifika veren ve seri numarası,
- imza değeri,
- varsa karşı imza metadata'sı.

Bu alanların bulunması imzanın geçerli, güvenilir veya GİB tarafından
onaylanmış olduğunu kanıtlamaz. Mevcut sürüm sertifika zinciri, zaman damgası,
imza değeri veya belge bütünlüğü üzerinde kriptografik doğrulama yapmaz.

## Build ve dağıtım

Kaynak kod standart Vite build sürecinden geçirilir. Depoya ait post-build
betiği, üretilen JavaScript ve CSS varlıklarını HTML içine alarak aşağıdaki tek
dağıtım dosyasını oluşturur:

```text
dist/EDEFTER_GORUNTULE.html
```

Build testi, dağıtım klasöründe yalnızca bu dosyanın bulunduğunu ve HTML'in
harici JavaScript veya stil dosyalarına bağlı olmadığını doğrular.

## Tasarım kararları

- Framework bağımlılığı yerine küçük ve denetlenebilir vanilla JavaScript
  modülleri tercih edilmiştir.
- Dağıtım kolaylığı için tek dosyalık çıktı korunmuştur.
- Gerçek müşteri belgeleri yerine sentetik fixture'lar kullanılmıştır.
- İmza konusunda yanlış güven oluşturmamak için doğrulama yapılmadığı arayüzde
  açıkça belirtilmiştir.
- Belge inceleme senaryosuna uygun olarak sade, kurumsal ve yazdırılabilir bir
  arayüz kullanılmıştır.
