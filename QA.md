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

## 9 Ekim — parça modeli güncellemesi

- 58 otomatik kontrol geçti; 10 model grubu, 7 kategori ve dokuma malzemeleri doğrulandı.
- Bütün, ayrılmış ve tek parça görünümleri; ayrılma sürgüsü, arka görünüm ve kopça yakın planı çalıştı.
- Orijinal logo ve harfli giriş; alt e. görseli korundu.
- 390 × 844 mobil görünümde yatay taşma ve kontrol örtüşmesi yok.
- Yeni modelin ilk yüklemesi 503 ile engellendi; fotoğraf ve yeniden deneme akışı başarıyla doğrulandı.
- Külot seçimi parça kontrollerini gizler; sütyene dönüşte kontroller yeniden etkinleşir.
- Blender ön/arka renderları ve masaüstü 3D görünümü incelendi.

- Kumaş güncellemesi: fotoğraf tabanlı renk/normal/pürüzlülük haritaları, ayrı ribana ve sol/sağ parça seçimi doğrulandı. Yeni model yaklaşık 1 MB.
- 60 kontrol aynı süreçteki JavaScript ayrıştırıcısıyla geçti; bu Windows oturumu alt süreç başlatmayı engellediği için standart komutun sözdizimi aşaması ayrıca kontrol edildi.
