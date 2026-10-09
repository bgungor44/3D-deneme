# Kaynaklar ve lisanslar

- **Kaynak proje:** [aligngr44/3D-site-deneme](https://github.com/aligngr44/3D-site-deneme), revizyon `bb208cf2cafdc22cf45e2d0ed085298b9022f6d5`. `models/sutyen.glb`, `models/panty.glb`, ürün fotoğrafları ve `js/models.js` temeli buradan alınmıştır. Kaynak depoda kök lisans bulunmadığından bu varlıklar için yeni bir genel kullanım lisansı beyan edilmiyor. Kullanım, görevi veren kullanıcının açık talebine dayanır.
- **Model üretimi:** Kaynak README sütyen modelinin Tripo çıktısından Blender ile düzeltildiğini, külot modelinin Blender ile üretildiğini belirtir. Yeniden üretim scriptleri kaynak projenin `blender/` klasöründedir.
- **Kumaş dokuları:** Kaynak proje, modelde [Poly Haven Crepe Satin](https://polyhaven.com/a/crepe_satin) ve [Bi Stretch](https://polyhaven.com/a/bi_stretch) CC0 dokuları kullanıldığını belirtir.
- **Three.js / Draco:** Kaynaktaki `vendor/three/` dizini korundu. Three.js MIT lisansı `vendor/three/LICENSE` dosyasındadır; dağıtım dosyalarının lisans başlıkları korunmuştur.
- **Cormorant Garamond ve Manrope:** Google Fonts dağıtımları; SIL Open Font License. Tam metinler `assets/fonts/` dizinindedir. Fontlar yerelde barındırılır.
- **Orijinal marka:** Üst menü, alt bilgi, favicon ve girişte `assets/ebru-logo.svg` kullanılır; dosya kaynak depodaki Ebru logosudur. Giriş animasyonu aynı SVG'nin kırpılmış dört kopyasını birleştirir; yeni bir marka logosu çizilmemiştir.
- **Yeni tasarım:** HTML/CSS sayfa düzeni, renk paleti, kodla oluşturulan ebru esintili “e.” deseni, metinler, arayüz ve 3D stüdyo kontrol katmanı bu proje için hazırlanmıştır.
- **Yeni anatomi modeli:** `blender/build_bra.py`, kaynak Tripo kap formunu yeniden örnekler ve ayrı Blender parçaları oluşturur. Kap ve astar için Poly Haven [Stretch Poplin](https://polyhaven.com/a/stretch_poplin) fotoğraf tabanlı CC0 renk/normal/pürüzlülük haritaları kullanılır (colormass, Rico Cilliers). Boya tonu nötrleştirilir; askı ve kenar lastiklerinde NumPy ile ribana haritaları üretilir. Kaynak model değiştirilmeden saklanmıştır. Yeni bir Tripo üretimi veya ücretli kredi kullanımı yapılmamıştır.

Fotoğraflar, eski sütyen ve külot modelleri kaynak varlıklardır. Yeni anatomi sütyeni bir tasarım demosudur; fiziksel ürünün malzemelerini veya üretim özelliklerini doğruladığı iddiasında değildir.
