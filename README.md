# Maden İmparatorluğu

Türkçe idle madencilik oyunu. Python, Java ve C# komut satırı sürümlerinin yanı
sıra telefondan tarayıcıyla oynanabilen, dokunmatik ekrana uyumlu bir mobil
sürümü bulunur.

## Üretim hattı

Oyunda beş yeni ocakla toplam on maden bulunur. Yeni ocaklar sırayla açılır;
hile modu açıkken açma ve geliştirme ücretsizdir.

| Maden | Üretim / saniye | Açma bedeli |
|---|---:|---:|
| Bakır Ocağı | $1 | Başlangıç |
| Demir Ocağı | $8 | $500 |
| Altın Ocağı | $50 | $5.000 |
| Elmas Ocağı | $350 | $50.000 |
| Kristal Ocağı | $2.500 | $500.000 |
| Uranyum Ocağı | $18.000 | $5.000.000 |
| Obsidyen Ocağı | $125.000 | $50.000.000 |
| Kobalt Ocağı | $900.000 | $500.000.000 |
| Mitril Ocağı | $6.000.000 | $5.000.000.000 |
| Antik Maden | $40.000.000 | $50.000.000.000 |

Eski oyun kayıtları yeni madenleri kilitli olarak ekleyip mevcut ilerlemeyi korur.

## Windows'ta çalıştırma

Komut İstemi'ni veya PowerShell'i bu klasörde açın:

```bat
run.bat python
run.bat java
run.bat csharp
run.bat mobile
```

`run.bat mobile` komutunu bilgisayarda çalıştırın. Aynı Wi-Fi ağına bağlı
telefonda, terminalde gösterilen `http://...:8000` adresini açın. Windows
güvenlik duvarı izin isterse, yalnızca kullandığınız özel ağ için erişime izin
verin. Sunucuyu durdurmak için `Ctrl+C` tuşlarına basın.

Mobil sürüm Chrome, Safari ve diğer güncel telefon tarayıcılarında çalışır.
İlerlemen o telefonun tarayıcı depolamasına kaydedilir; masaüstü ve mobil oyun
kayıtları ortak değildir. Çevrimdışı kazanç en fazla 8 saate kadar hesaplanır.
Telefon ve bilgisayar aynı yerel ağa bağlı olmalıdır.

Python için Python 3.9+, Java için JDK (Java ile birlikte `javac`), C# sürümü
için .NET 9 SDK gerekir. Komutları argümansız çalıştırmak seçenekleri gösterir.

Derleyici olmadan doğrudan çalıştırma:

```bat
python miner.py
```

Java'yı elle derleyip başlatma:

```bat
javac -encoding UTF-8 MinerGame.java
java -Dfile.encoding=UTF-8 MinerGame
```

C# sürümü:

```bat
dotnet run --project csharp\MinerGame.csproj
```

Kayıtlar Python için `miner_save.json`, Java için
`miner_save_java.properties`, C# için `miner_save_csharp.json` ve mobil sürümde
telefonun tarayıcı depolamasında tutulur.
