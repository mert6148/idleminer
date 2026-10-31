using System.Text.Json;

internal sealed class GameState
{
    public double Cash { get; set; }
    public int[] Levels { get; set; } = [1, 0, 0, 0, 0];
    public bool CheatMode { get; set; } = true;
    public int Prestige { get; set; }
    public double LastSaved { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() / 1000.0;
}

internal static class Program
{
    private static readonly string[] Names =
        ["Bakır Ocağı", "Demir Ocağı", "Altın Ocağı", "Elmas Ocağı", "Kristal Ocağı"];
    private static readonly double[] Income = [1, 8, 50, 350, 2500];
    private static readonly double[] UnlockCost = [0, 500, 5000, 50000, 500000];
    private static readonly string SaveFile = "miner_save_csharp.json";
    private const double OfflineLimitSeconds = 8 * 60 * 60;

    private static double Now() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() / 1000.0;
    private static string FormatCash(double amount) => $"${amount:N2}";

    private static double ProductionPerSecond(GameState game)
    {
        double total = 0;
        for (int i = 0; i < Names.Length; i++)
        {
            total += Income[i] * game.Levels[i];
        }
        total *= 1 + 0.5 * game.Prestige;
        return game.CheatMode ? total * 10 : total;
    }

    private static GameState LoadGame()
    {
        if (!File.Exists(SaveFile))
        {
            return new GameState();
        }

        GameState? game;
        try
        {
            game = JsonSerializer.Deserialize<GameState>(File.ReadAllText(SaveFile));
        }
        catch (JsonException exception)
        {
            Console.Error.WriteLine($"Kayıt dosyası okunamadı: {exception.Message}");
            return new GameState();
        }

        if (game is null)
        {
            Console.Error.WriteLine("Kayıt dosyası boş; yeni oyun başlatılıyor.");
            return new GameState();
        }

        game.Cash = double.IsFinite(game.Cash) ? Math.Max(0, game.Cash) : 0;
        game.Prestige = Math.Max(0, game.Prestige);
        int[] levels = new int[Names.Length];
        for (int i = 0; i < levels.Length && i < game.Levels.Length; i++)
        {
            levels[i] = Math.Max(0, game.Levels[i]);
        }
        levels[0] = Math.Max(1, levels[0]);
        game.Levels = levels;
        if (!double.IsFinite(game.LastSaved) || game.LastSaved <= 0)
        {
            game.LastSaved = Now();
        }

        double elapsed = Math.Min(OfflineLimitSeconds, Math.Max(0, Now() - game.LastSaved));
        double earnings = ProductionPerSecond(game) * elapsed;
        game.Cash += earnings;
        if (earnings >= 0.01)
        {
            Console.WriteLine($"Çevrimdışıyken {FormatCash(earnings)} kazandın.");
        }
        return game;
    }

    private static void SaveGame(GameState game)
    {
        game.LastSaved = Now();
        File.WriteAllText(SaveFile, JsonSerializer.Serialize(game, new JsonSerializerOptions
        {
            WriteIndented = true
        }));
    }

    private static void ShowStatus(GameState game)
    {
        Console.WriteLine("\n================================================");
        Console.WriteLine($"Nakit: {FormatCash(game.Cash)}");
        Console.WriteLine($"Üretim: {FormatCash(ProductionPerSecond(game))} / saniye");
        Console.WriteLine($"Hile modu: {(game.CheatMode ? "AÇIK (10x üretim, ücretsiz geliştirme)" : "KAPALI")} "
            + $"| Prestij çarpanı: {1 + 0.5 * game.Prestige:F1}x");
        Console.WriteLine("------------------------------------------------");
        for (int i = 0; i < Names.Length; i++)
        {
            if (game.Levels[i] > 0)
            {
                Console.WriteLine($"{Names[i]}: seviye {game.Levels[i]} — "
                    + $"{FormatCash(Income[i] * game.Levels[i])} / saniye");
            }
            else
            {
                Console.WriteLine($"{Names[i]}: kilitli — açma bedeli {FormatCash(UnlockCost[i])}");
            }
        }
        Console.WriteLine("================================================");
    }

    private static void UpgradeMine(GameState game)
    {
        for (int i = 0; i < game.Levels.Length; i++)
        {
            if (game.Levels[i] > 0)
            {
                double cost = 50 * Math.Pow(game.Levels[i] + 1, 1.6) * (i + 1);
                Console.WriteLine($"{i + 1}) {Names[i]} seviye {game.Levels[i]} → "
                    + $"{game.Levels[i] + 1} ({(game.CheatMode ? "ÜCRETSİZ" : FormatCash(cost))})");
            }
        }
        Console.Write("Geliştirilecek maden (vazgeç: Enter): ");
        string choice = Console.ReadLine()?.Trim() ?? "";
        if (choice.Length == 0)
        {
            return;
        }
        if (!int.TryParse(choice, out int selection)
            || selection < 1 || selection > game.Levels.Length
            || game.Levels[selection - 1] <= 0)
        {
            Console.WriteLine("Geçerli ve açık bir maden numarası gir.");
            return;
        }
        int index = selection - 1;
        double upgradeCost = 50 * Math.Pow(game.Levels[index] + 1, 1.6) * (index + 1);
        if (!game.CheatMode && game.Cash < upgradeCost)
        {
            Console.WriteLine("Bu geliştirme için yeterli nakdin yok.");
            return;
        }
        if (!game.CheatMode)
        {
            game.Cash -= upgradeCost;
        }
        game.Levels[index]++;
        Console.WriteLine($"{Names[index]} geliştirildi!");
    }

    private static void UnlockMine(GameState game)
    {
        for (int i = 0; i < game.Levels.Length; i++)
        {
            if (game.Levels[i] == 0)
            {
                if (!game.CheatMode && game.Cash < UnlockCost[i])
                {
                    Console.WriteLine("Bu madeni açmak için yeterli nakdin yok.");
                    return;
                }
                if (!game.CheatMode)
                {
                    game.Cash -= UnlockCost[i];
                }
                game.Levels[i] = 1;
                Console.WriteLine($"{Names[i]} açıldı!");
                return;
            }
        }
        Console.WriteLine("Bütün madenler açık.");
    }

    private static void Prestige(GameState game)
    {
        if (game.Cash < 1_000_000)
        {
            Console.WriteLine($"Prestij için en az {FormatCash(1_000_000)} nakit gerekli.");
            return;
        }
        game.Cash = 0;
        game.Levels = [1, 0, 0, 0, 0];
        game.Prestige++;
        Console.WriteLine($"Prestij yaptın! Üretimin artık {1 + 0.5 * game.Prestige:F1}x.");
    }

    private static void Play()
    {
        GameState game = LoadGame();
        double lastTick = Now();
        Console.WriteLine("Maden İmparatorluğu'na hoş geldin!");
        Console.WriteLine("Tek oyunculu idle madencilik oyunu — hile modu başlangıçta açık.");

        while (true)
        {
            double now = Now();
            game.Cash += ProductionPerSecond(game) * (now - lastTick);
            lastTick = now;
            ShowStatus(game);
            Console.WriteLine("1) Maden geliştir  2) Yeni maden aç  3) Hile modunu aç/kapat");
            Console.WriteLine("4) Hile: 100.000 nakit al  5) Prestij yap  6) 60 saniye bekle");
            Console.WriteLine("0) Kaydet ve çık");
            Console.Write("> ");
            string choice = Console.ReadLine()?.Trim() ?? "";

            switch (choice)
            {
                case "1":
                    UpgradeMine(game);
                    break;
                case "2":
                    UnlockMine(game);
                    break;
                case "3":
                    game.CheatMode = !game.CheatMode;
                    Console.WriteLine($"Hile modu {(game.CheatMode ? "açık." : "kapalı.")}");
                    break;
                case "4":
                    if (game.CheatMode)
                    {
                        game.Cash += 100_000;
                        Console.WriteLine("Hile kullanıldı: 100.000 nakit eklendi.");
                    }
                    else
                    {
                        Console.WriteLine("Önce hile modunu aç.");
                    }
                    break;
                case "5":
                    Prestige(game);
                    break;
                case "6":
                    Console.WriteLine("60 saniye ilerliyor...");
                    Thread.Sleep(TimeSpan.FromSeconds(60));
                    break;
                case "0":
                    SaveGame(game);
                    Console.WriteLine("Oyun kaydedildi. Görüşürüz!");
                    return;
                default:
                    Console.WriteLine("Menüdeki seçeneklerden birini gir.");
                    break;
            }
        }
    }

    private static int Main()
    {
        try
        {
            Play();
            return 0;
        }
        catch (IOException exception)
        {
            Console.Error.WriteLine($"Oyun kaydedilemedi veya yüklenemedi: {exception.Message}");
            return 1;
        }
    }
}
