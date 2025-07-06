# 📋 Personel İzin Raporu Sistemi

Modern web tabanlı personel izin raporu uygulaması. Excel dosyalarından personel izin verilerini okuyarak haftalık raporlar oluşturur.

## ✨ Özellikler

- 📊 **Excel Dosyası Desteği**: .xlsx ve .xls formatlarında dosya okuma
- 🗓️ **Haftalık Raporlar**: Belirtilen tarih aralığında haftalık çalışan personel raporları
- 🔄 **İzin Birleştirme**: Ardışık yıllık ve idari izinleri otomatik birleştirir
- 📱 **Responsive Tasarım**: Mobil ve desktop uyumlu modern arayüz
- 🖨️ **Yazdırma Desteği**: Profesyonel yazdırma formatı
- 🇹🇷 **Türkçe Tarih Desteği**: Türkçe tarih formatları ve hafta sonu hesaplamaları

## 🚀 Kullanım

1. **Excel Dosyası Hazırlayın**:
   - A Sütunu: Personel İsmi
   - B-C Sütunları: İdari İzin Başlangıç/Bitiş Tarihleri
   - E-F Sütunları: Yıllık İzin Başlangıç/Bitiş Tarihleri
   - H Sütunu: İş Başlama Tarihi

2. **Web Uygulamasını Açın**: `index.html` dosyasını tarayıcıda açın

3. **Excel Dosyasını Yükleyin**: Dosya seç butonuyla Excel dosyanızı seçin

4. **Tarih Aralığını Belirleyin**: Rapor oluşturmak istediğiniz hafta aralığını seçin

5. **Rapor Oluşturun**: "Rapor Oluştur" butonuyla haftalık raporları görüntüleyin

## 📁 Dosya Yapısı

```
📦 personel-izin-raporu/
├── 📄 index.html          # Ana HTML dosyası
├── 🎨 styles.css          # CSS stilleri
├── ⚙️ script.js           # JavaScript kodları
├── 📖 README.md           # Proje dokümantasyonu
└── 📊 örnek_dosya.xlsx    # Örnek Excel dosyası
```

## 🛠️ Teknolojiler

- **HTML5**: Modern web yapısı
- **CSS3**: Responsive tasarım ve animasyonlar
- **JavaScript ES6+**: İstemci tarafı mantık
- **SheetJS**: Excel dosyası okuma
- **Font Awesome**: İkonlar
- **Google Fonts**: Typography

## 📋 Excel Dosyası Formatı

| Sütun | İçerik |
|-------|--------|
| A | İsim |
| B | İdari İzin Başlangıç |
| C | İdari İzin Bitiş |
| D | (Boş) |
| E | Yıllık İzin Başlangıç |
| F | Yıllık İzin Bitiş |
| G | İzin Gün Sayısı |
| H | İş Başlama Tarihi |

## 🎯 İş Kuralları

- **Hafta Sonu**: Cumartesi ve Pazar tatil günleri
- **İzin Birleştirme**: Arasında 1 iş günü veya daha az olan izinler birleştirilir
- **Tarih Formatları**: DD.MM.YYYY, "21 Temmuz 2025" formatları desteklenir
- **İzin Önceliği**: İzin tarihleri iş başlama tarihinden önceliklidir

## 👨‍💻 Geliştirici

**Burak Necip Civan**

## 📄 Lisans

Bu proje açık kaynak kodludur.

---

*2025 Personel İzin Raporu Sistemi | dev. by buraknecipcivan* 