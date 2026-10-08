# Ebru · 3D Koleksiyon

Ebru için yeniden tasarlanmış, etkileşimli bir iç giyim kataloğu. Sıcak krem ve bordo palet, editoryal tipografi, gerçek GLB modelleri ve fotoğrafları birleştirir.

## Çalıştırma

Node.js 20 veya üzeri ile, bağımlılık kurmadan:

```sh
node scripts/serve.mjs
```

Tarayıcıda `http://127.0.0.1:4173` adresini açın. Alternatif: `python -m http.server 8000`. `file://` üzerinden açmayın; modeller ve JavaScript modülleri HTTP gerektirir.

## Özellikler

- Gerçek sütyen ve dantel külot modelleri; ürünler ilk kullanımda yüklenir ve bellekte saklanır.
- Beş renk ve iki stüdyo ışığı.
- Sürükleyerek döndürme, yakınlaştırma, otomatik dönüş ve görünümü sıfırlama.
- Numaralı 3D bilgi noktaları ve ilgili parçaya dönen detay listesi.
- Klavye: canvas odaktayken ok tuşları döndürür; `+` / `−` yakınlaştırır; `Home` sıfırlar; `Escape` detay panelini kapatır.
- Mobilde yatay sürükleme modeli döndürür, dikey hareket sayfayı kaydırır. Ekrandaki +/− düğmeleri yakınlaştırır. Tarayıcının izin verdiği dokunma hareketlerinde iki parmakla yakınlaştırma da desteklenir.
- WebGL veya model yüklemesi başarısız olursa ürün fotoğrafı ve yeniden deneme seçeneği gösterilir.
- Görünmeyen sekmede veya ekran dışında çizim durur. Otomatik dönüş kapalıyken değişiklik olmadıkça yeni kare çizilmez. Azaltılmış hareket tercihi geçişleri kapatır.
- Three.js, Draco, modeller, fotoğraflar ve fontlar yereldir; çalışma sırasında harici CDN gerekmez.

## Dosyalar

| Dosya            | İçerik                                                       |
| ---------------- | ------------------------------------------------------------ |
| `index.html`     | Sayfa yapısı ve metinler                                     |
| `css/style.css`  | Görsel tasarım ve mobil düzen                                |
| `js/app.js`      | Arayüz, seçimler, yükleme ve hata durumları                  |
| `js/viewer.js`   | Three.js stüdyo, ışıklar, giriş kontrolleri, bilgi noktaları |
| `js/models.js`   | Kaynaktan uyarlanan GLB yükleyici ve kumaş malzemeleri       |
| `js/products.js` | Renkler ve örnek parça açıklamaları                          |
| `models/`        | Kaynak repodan kullanılan modeller                           |
| `assets/`        | Fotoğraflar, ikon, yerel fontlar                             |

## Kontrol

```sh
node scripts/check.mjs
```

Bu kontrol GLB bütünlüğünü, modeldeki tüm bilgi noktalarını, statik varlıkları, JavaScript sözdizimini, yerel fontları ve sayfa bağlantılarını doğrular. GitHub Actions aynı kontrolü push ve PR olaylarında çalıştırır. Tarayıcı testlerinin kapsamı `QA.md` içindedir.

## Yayınlama

Statik bir sitedir: build komutu ve npm kurulumu gerekmez. Yayın klasörü depo köküdür (`.`). GitHub Pages kullanmak için depo ayarlarından **Pages → Deploy from a branch → main / (root)** seçilebilir. Render Static Site veya başka bir statik sunucu da kullanılabilir. Bağıl yollar alt klasörde barındırmayı destekler.

## Kaynak ve kapsam

Modeller, ürün fotoğrafları, Three.js ve model yükleyicinin temeli [aligngr44/3D-site-deneme](https://github.com/aligngr44/3D-site-deneme) deposundan alınmıştır. Kaynak revizyonu: `bb208cf2cafdc22cf45e2d0ed085298b9022f6d5`. Bu yeniden tasarım, kullanıcının kaynak depodaki varlıkları kullanma talebi üzerine hazırlanmıştır. Lisans ve kaynak ayrıntıları `CREDITS.md` içindedir.

Bu sürüm bir **dijital koleksiyon konseptidir**. Marka anlatısı ve parça metinleri tasarım önerisidir; onaylanmış malzeme, kalite, üretim yeri veya performans iddiası içermez. Renkler dijital görselleştirmedir; fiziksel ürünle birebir eşleşme garantisi değildir. Ödeme, sepet veya sipariş altyapısı yoktur.
