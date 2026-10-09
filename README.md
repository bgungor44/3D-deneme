# Ebru · 3D Koleksiyon

Ebru için yeniden tasarlanmış, etkileşimli bir iç giyim kataloğu. Sıcak krem ve bordo palet, editoryal tipografi, gerçek GLB modelleri ve fotoğrafları birleştirir.

## Çalıştırma

Node.js 20 veya üzeri ile, bağımlılık kurmadan:

```sh
node scripts/serve.mjs
```

Tarayıcıda `http://127.0.0.1:4173` adresini açın. Alternatif: `python -m http.server 8000`. `file://` üzerinden açmayın; modeller ve JavaScript modülleri HTTP gerektirir.

## Özellikler

- Repodaki orijinal Ebru logosu; “Siteye gir” sonrasında E, B, R ve U harflerinin farklı yönlerden birleşmesi. Giriş kaydırmayı kilitlemez ve atlanabilir.
- Sütyende 10 ayrı nesne grubu, 7 inceleme kategorisi ve sol/sağ parça seçenekleri: kap/astar, balen/kanal, fiyonk, askı/toka, kanatlar, alt bant ve kopça.
- Bütün, parçalarına ayır (miktar sürgüsüyle) ve tek parça görünümleri. İki sıralı, üç kademeli arka kopça için yakın plan.
- Fotoğraf tabanlı dokuma PBR haritaları, ayrı ribana lastikleri, dikiş geometrisi, astar kalınlığı ve metal ayar tokaları.
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
| `models/`        | Yeni Blender modeli ve kaynak modeller                           |
| `assets/`        | Fotoğraflar, ikon, yerel fontlar                             |

## Blender dosyası ve yeniden üretim

`blender/ebru-sutyen.blend` düzenlenebilir model ve render stüdyosudur. `models/ebru-anatomy.glb` sitede kullanılan, dokuları içinde paketlenmiş modeldir. Blender 4.5.3 LTS ile yeniden üretmek için:

```sh
blender --background --factory-startup --python blender/build_bra.py
```

Script, depodaki **Tripo kökenli `models/sutyen.glb` kap yüzeylerini referans alarak yeniden örnekler**; askılar, bantlar, astarlar, dikişler, balen kanalları, fiyonk ve kopça Blender geometrisi olarak oluşturulur. Mevcut Tripo hesabından yeni model üretimi yapılmadı ve kredi kullanılmadı. Bu model tamamen sıfırdan yapılmış bir tarama veya birebir ürün kopyası değildir.

`part_*` nesnelerindeki `partId` ve `explode` özel alanları web parça görünümünü besler. `explode` Blender koordinatlarındadır; yükleyici glTF'nin Y-yukarı eksenlerine dönüştürür. Fotoğraflanmış Stretch Poplin CC0 haritaları `blender/textures/` içindedir. Script kumaş boya tonunu nötrleştirir, ayrı ribana haritaları üretir ve dokuları `.blend` içine paketler. Webde renk değişimi için nötr dokular ayrıca yüklenir. Ön/arka renderlar `blender/front.png` ve `blender/back.png` dosyalarıdır.

Külot modeli bu geliştirmede değiştirilmedi. Alt bölümdeki bordo desenli “e.” görseli korundu.

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
