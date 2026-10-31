# Maden İmparatorluğu

Türkçe komut satırı idle madencilik oyunu. Python, Java ve C# sürümleri aynı
temel oyun döngüsünü, hile modunu, maden geliştirmeyi, prestiji ve çevrimdışı
kazancı sunar. Her dil ayrı bir kayıt dosyası kullanır.

## Windows'ta çalıştırma

Komut İstemi'ni veya PowerShell'i bu klasörde açın:

```bat
run.bat python
run.bat java
run.bat csharp
```

Komutları argümansız çalıştırmak seçenekleri gösterir. Python için Python 3.9+
ve Java için JDK (Java ile birlikte `javac`) gerekir. C# sürümü .NET 9 SDK
kullanır.

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
`miner_save_java.properties` ve C# için `miner_save_csharp.json` dosyalarında
tutulur.
