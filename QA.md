# Doğrulama notları

8 Ekim 2026 tarihinde yerel HTTP sunucusunda, Chromium tabanlı tarayıcı ile doğrulandı.

## Otomatik kontrol

`node scripts/check.mjs`: başarılı.

GLB dosya bütünlüğü, 13 bilgi noktası, JavaScript sözdizimi, yerel statik dosyalar/fontlar ve sayfa içi bağlantılar kontrol edilir. GitHub Actions aynı komutu çalıştırır.

## Tarayıcıda doğrulananlar

- Sütyen ve külot GLB modelleri yüklendi; normal kullanımda tarayıcı hata/uyarı kaydı yok.
- Renk seçimi etiket ve model görünümünü güncelliyor.
- Akşam ışığı ve gün ışığı seçilebiliyor.
- Yakınlaştırma, otomatik dönüş ve sıfırlama kontrolleri çalışıyor.
- Arka kopça seçimi detay metnini açıp modeli arkaya döndürüyor.
- Klavyeyle ok tuşları, `+`, `Home` ve detay panelinde `Escape` kullanıldı. Panel kapanınca odak açma düğmesine dönüyor.
- 390 × 844 mobil görünümde yatay taşma yok; her iki ürün fotoğrafı yüklü.
- 1280 × 720 masaüstü görünümü ve tam sayfa düzeni görsel olarak incelendi.
- Ayrı bir test sunucusunda ilk GLB isteği kasıtlı olarak 503 ile engellendi: ürün fotoğrafına geçildi, 3D kontrolleri devre dışı kaldı. Yeniden denemede model yüklendi ve kontroller etkinleşti.

## Sınırlar

Fiziksel iOS/Android cihazında çoklu dokunma, gerçek WebGL donanım kaybı ve Safari/Firefox bu oturumda test edilmedi. Azaltılmış hareket ve ekran dışında çizimi durdurma davranışları kodda uygulanmıştır; işletim sistemi tercihi değiştirilerek ölçülmedi. Renk ve malzeme görünümleri ekran/ışık simülasyonudur.
