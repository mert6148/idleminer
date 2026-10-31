import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Locale;
import java.util.Properties;
import java.util.Scanner;

public class MinerGame {
    private static final String[] NAMES = {
        "Bakır Ocağı", "Demir Ocağı", "Altın Ocağı", "Elmas Ocağı", "Kristal Ocağı",
        "Uranyum Ocağı", "Obsidyen Ocağı", "Kobalt Ocağı", "Mitril Ocağı", "Antik Maden"
    };
    private static final double[] INCOME = {
        1, 8, 50, 350, 2500, 18000, 125000, 900000, 6000000, 40000000
    };
    private static final double[] UNLOCK_COST = {
        0, 500, 5000, 50000, 500000, 5000000, 50000000, 500000000,
        5000000000.0, 50000000000.0
    };
    private static final String SAVE_FILE = "miner_save_java.properties";
    private static final long OFFLINE_LIMIT_SECONDS = 8 * 60 * 60;

    private static double cash;
    private static final int[] levels = new int[NAMES.length];
    private static boolean cheatMode = true;
    private static int prestige;

    static {
        levels[0] = 1;
    }

    private static double number(Properties data, String key, double fallback) {
        try {
            return Double.parseDouble(data.getProperty(key, Double.toString(fallback)));
        } catch (NumberFormatException exception) {
            return fallback;
        }
    }

    private static void loadGame() throws IOException {
        Properties data = new Properties();
        try (FileInputStream input = new FileInputStream(SAVE_FILE)) {
            data.load(input);
        } catch (java.io.FileNotFoundException exception) {
            return;
        }
        cash = Math.max(0, number(data, "cash", 0));
        prestige = Math.max(0, (int) number(data, "prestige", 0));
        cheatMode = Boolean.parseBoolean(data.getProperty("cheatMode", "true"));
        for (int i = 0; i < levels.length; i++) {
            levels[i] = Math.max(0, (int) number(data, "level." + i, levels[i]));
        }
        levels[0] = Math.max(1, levels[0]);
        double lastSaved = number(data, "lastSaved", System.currentTimeMillis() / 1000.0);
        double elapsed = Math.min(
            OFFLINE_LIMIT_SECONDS,
            Math.max(0, System.currentTimeMillis() / 1000.0 - lastSaved)
        );
        double earnings = productionPerSecond() * elapsed;
        cash += earnings;
        if (earnings >= 0.01) {
            System.out.println("Çevrimdışıyken " + formatCash(earnings) + " kazandın.");
        }
    }

    private static void saveGame() throws IOException {
        Properties data = new Properties();
        data.setProperty("cash", Double.toString(cash));
        data.setProperty("cheatMode", Boolean.toString(cheatMode));
        data.setProperty("prestige", Integer.toString(prestige));
        data.setProperty("lastSaved", Double.toString(System.currentTimeMillis() / 1000.0));
        for (int i = 0; i < levels.length; i++) {
            data.setProperty("level." + i, Integer.toString(levels[i]));
        }
        try (FileOutputStream output = new FileOutputStream(SAVE_FILE)) {
            data.store(output, "Maden Imparatorlugu kaydi");
        }
    }

    private static double productionPerSecond() {
        double total = 0;
        for (int i = 0; i < levels.length; i++) {
            total += INCOME[i] * levels[i];
        }
        total *= 1 + 0.5 * prestige;
        return cheatMode ? total * 10 : total;
    }

    private static String formatCash(double amount) {
        return String.format(Locale.US, "$%,.2f", amount);
    }

    private static void showStatus() {
        System.out.println("\n================================================");
        System.out.println("Nakit: " + formatCash(cash));
        System.out.println("Üretim: " + formatCash(productionPerSecond()) + " / saniye");
        System.out.println("Hile modu: " + (cheatMode
            ? "AÇIK (10x üretim, ücretsiz geliştirme)" : "KAPALI")
            + " | Prestij çarpanı: " + String.format(Locale.US, "%.1f", 1 + 0.5 * prestige) + "x");
        System.out.println("------------------------------------------------");
        for (int i = 0; i < levels.length; i++) {
            if (levels[i] > 0) {
                System.out.println(NAMES[i] + ": seviye " + levels[i] + " — "
                    + formatCash(INCOME[i] * levels[i]) + " / saniye");
            } else {
                System.out.println(NAMES[i] + ": kilitli — açma bedeli "
                    + formatCash(UNLOCK_COST[i]));
            }
        }
        System.out.println("================================================");
    }

    private static void upgradeMine(Scanner scanner) {
        for (int i = 0; i < levels.length; i++) {
            if (levels[i] > 0) {
                double cost = 50 * Math.pow(levels[i] + 1, 1.6) * (i + 1);
                System.out.println((i + 1) + ") " + NAMES[i] + " seviye " + levels[i]
                    + " → " + (levels[i] + 1) + " ("
                    + (cheatMode ? "ÜCRETSİZ" : formatCash(cost)) + ")");
            }
        }
        System.out.print("Geliştirilecek maden (vazgeç: Enter): ");
        String choice = scanner.nextLine().trim();
        if (choice.isEmpty()) return;
        try {
            int index = Integer.parseInt(choice) - 1;
            if (index < 0 || index >= levels.length || levels[index] <= 0) {
                System.out.println("Geçerli ve açık bir maden numarası gir.");
                return;
            }
            double cost = 50 * Math.pow(levels[index] + 1, 1.6) * (index + 1);
            if (!cheatMode && cash < cost) {
                System.out.println("Bu geliştirme için yeterli nakdin yok.");
                return;
            }
            if (!cheatMode) cash -= cost;
            levels[index]++;
            System.out.println(NAMES[index] + " geliştirildi!");
        } catch (NumberFormatException exception) {
            System.out.println("Geçerli ve açık bir maden numarası gir.");
        }
    }

    private static void unlockMine() {
        for (int i = 0; i < levels.length; i++) {
            if (levels[i] == 0) {
                if (!cheatMode && cash < UNLOCK_COST[i]) {
                    System.out.println("Bu madeni açmak için yeterli nakdin yok.");
                    return;
                }
                if (!cheatMode) cash -= UNLOCK_COST[i];
                levels[i] = 1;
                System.out.println(NAMES[i] + " açıldı!");
                return;
            }
        }
        System.out.println("Bütün madenler açık.");
    }

    private static void play() throws IOException {
        loadGame();
        long lastTick = System.currentTimeMillis();
        try (Scanner scanner = new Scanner(System.in, "UTF-8")) {
            System.out.println("Maden İmparatorluğu'na hoş geldin!");
            System.out.println("Tek oyunculu idle madencilik oyunu — hile modu başlangıçta açık.");
            while (true) {
                long now = System.currentTimeMillis();
                cash += productionPerSecond() * (now - lastTick) / 1000.0;
                lastTick = now;
                showStatus();
                System.out.println("1) Maden geliştir  2) Yeni maden aç  3) Hile modunu aç/kapat");
                System.out.println("4) Hile: 100.000 nakit al  5) Prestij yap  6) 60 saniye bekle");
                System.out.println("0) Kaydet ve çık");
                System.out.print("> ");
                String choice = scanner.nextLine().trim();
                switch (choice) {
                    case "1": upgradeMine(scanner); break;
                    case "2": unlockMine(); break;
                    case "3":
                        cheatMode = !cheatMode;
                        System.out.println("Hile modu " + (cheatMode ? "açık." : "kapalı."));
                        break;
                    case "4":
                        if (cheatMode) {
                            cash += 100_000;
                            System.out.println("Hile kullanıldı: 100.000 nakit eklendi.");
                        } else {
                            System.out.println("Önce hile modunu aç.");
                        }
                        break;
                    case "5":
                        if (cash < 1_000_000) {
                            System.out.println("Prestij için en az $1,000,000.00 nakit gerekli.");
                        } else {
                            cash = 0;
                            for (int i = 0; i < levels.length; i++) levels[i] = 0;
                            levels[0] = 1;
                            prestige++;
                            System.out.println("Prestij yaptın! Üretimin artık "
                                + String.format(Locale.US, "%.1f", 1 + 0.5 * prestige) + "x.");
                        }
                        break;
                    case "6":
                        System.out.println("60 saniye ilerliyor...");
                        try {
                            Thread.sleep(60_000);
                        } catch (InterruptedException exception) {
                            Thread.currentThread().interrupt();
                            return;
                        }
                        break;
                    case "0":
                        saveGame();
                        System.out.println("Oyun kaydedildi. Görüşürüz!");
                        return;
                    default:
                        System.out.println("Menüdeki seçeneklerden birini gir.");
                }
            }
        }
    }

    public static void main(String[] args) {
        try {
            play();
        } catch (IOException exception) {
            System.err.println("Oyun kaydedilemedi veya yüklenemedi: " + exception.getMessage());
            System.exit(1);
        }
    }
}
