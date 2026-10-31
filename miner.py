"""A small Turkish-language idle mining game with an optional cheat mode."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any


SAVE_FILE = Path(__file__).with_name("miner_save.json")
OFFLINE_LIMIT_SECONDS = 8 * 60 * 60

MINES = [
    {"name": "Bakır Ocağı", "income": 1.0, "unlock_cost": 0},
    {"name": "Demir Ocağı", "income": 8.0, "unlock_cost": 500},
    {"name": "Altın Ocağı", "income": 50.0, "unlock_cost": 5_000},
    {"name": "Elmas Ocağı", "income": 350.0, "unlock_cost": 50_000},
    {"name": "Kristal Ocağı", "income": 2_500.0, "unlock_cost": 500_000},
]


def new_game() -> dict[str, Any]:
    return {
        "cash": 0.0,
        "levels": [1, 0, 0, 0, 0],
        "cheat_mode": True,
        "prestige": 0,
        "last_saved": time.time(),
    }


def load_game() -> dict[str, Any]:
    if not SAVE_FILE.exists():
        return new_game()

    try:
        with SAVE_FILE.open("r", encoding="utf-8") as save_file:
            data = json.load(save_file)
    except json.JSONDecodeError:
        print("Kayıt dosyası okunamadı; yeni oyun başlatılıyor.")
        return new_game()

    if not isinstance(data, dict):
        print("Kayıt dosyası geçersiz; yeni oyun başlatılıyor.")
        return new_game()

    defaults = new_game()
    levels = data.get("levels")
    if not isinstance(levels, list):
        levels = defaults["levels"]
    levels = [
        max(0, int(level)) if isinstance(level, (int, float)) else 0
        for level in levels[: len(MINES)]
    ]
    levels.extend([0] * (len(MINES) - len(levels)))
    levels[0] = max(1, levels[0])

    cash = data.get("cash", 0)
    prestige = data.get("prestige", 0)
    last_saved = data.get("last_saved", time.time())
    game = {
        "cash": max(0.0, float(cash)) if isinstance(cash, (int, float)) else 0.0,
        "levels": levels,
        "cheat_mode": bool(data.get("cheat_mode", True)),
        "prestige": max(0, int(prestige))
        if isinstance(prestige, (int, float))
        else 0,
        "last_saved": float(last_saved)
        if isinstance(last_saved, (int, float))
        else time.time(),
    }

    elapsed = min(max(0.0, time.time() - game["last_saved"]), OFFLINE_LIMIT_SECONDS)
    earnings = production_per_second(game) * elapsed
    game["cash"] += earnings
    if earnings >= 0.01:
        print(f"Çevrimdışıyken {format_cash(earnings)} kazandın.")
    return game


def format_cash(amount: float) -> str:
    return f"${amount:,.2f}"


def production_per_second(game: dict[str, Any]) -> float:
    total = sum(
        mine["income"] * level
        for mine, level in zip(MINES, game["levels"])
    )
    total *= 1 + 0.5 * game["prestige"]
    if game["cheat_mode"]:
        total *= 10
    return total


def save_game(game: dict[str, Any]) -> None:
    game["last_saved"] = time.time()
    with SAVE_FILE.open("w", encoding="utf-8") as save_file:
        json.dump(game, save_file, ensure_ascii=False, indent=2)


def show_status(game: dict[str, Any]) -> None:
    multiplier = 1 + 0.5 * game["prestige"]
    cheat_label = "AÇIK (10x üretim, ücretsiz geliştirme)" if game["cheat_mode"] else "KAPALI"
    print("\n" + "=" * 48)
    print(f"Nakit: {format_cash(game['cash'])}")
    print(f"Üretim: {format_cash(production_per_second(game))} / saniye")
    print(f"Hile modu: {cheat_label} | Prestij çarpanı: {multiplier:.1f}x")
    print("-" * 48)
    for mine, level in zip(MINES, game["levels"]):
        if level:
            print(
                f"{mine['name']}: seviye {level} — "
                f"{format_cash(mine['income'] * level)} / saniye"
            )
        else:
            print(
                f"{mine['name']}: kilitli — "
                f"açma bedeli {format_cash(mine['unlock_cost'])}"
            )
    print("=" * 48)


def upgrade_mine(game: dict[str, Any]) -> None:
    available = [
        index for index, level in enumerate(game["levels"]) if level > 0
    ]
    for index in available:
        level = game["levels"][index]
        cost = 50 * (level + 1) ** 1.6 * (index + 1)
        free = game["cheat_mode"]
        print(
            f"{index + 1}) {MINES[index]['name']} seviye {level} → {level + 1} "
            f"({('ÜCRETSİZ' if free else format_cash(cost))})"
        )

    choice = input("Geliştirilecek maden (vazgeç: Enter): ").strip()
    if not choice:
        return
    if not choice.isdigit() or int(choice) - 1 not in available:
        print("Geçerli ve açık bir maden numarası gir.")
        return

    index = int(choice) - 1
    level = game["levels"][index]
    cost = 50 * (level + 1) ** 1.6 * (index + 1)
    if not game["cheat_mode"] and game["cash"] < cost:
        print("Bu geliştirme için yeterli nakdin yok.")
        return
    if not game["cheat_mode"]:
        game["cash"] -= cost
    game["levels"][index] += 1
    print(f"{MINES[index]['name']} geliştirildi!")


def unlock_mine(game: dict[str, Any]) -> None:
    locked = [
        index for index, level in enumerate(game["levels"]) if level == 0
    ]
    if not locked:
        print("Bütün madenler açık.")
        return

    index = locked[0]
    mine = MINES[index]
    cost = mine["unlock_cost"]
    free = game["cheat_mode"]
    print(
        f"{mine['name']} açılacak. Bedel: "
        f"{'ÜCRETSİZ' if free else format_cash(cost)}"
    )
    if not free and game["cash"] < cost:
        print("Bu madeni açmak için yeterli nakdin yok.")
        return
    if not free:
        game["cash"] -= cost
    game["levels"][index] = 1
    print(f"{mine['name']} açıldı!")


def prestige(game: dict[str, Any]) -> None:
    requirement = 1_000_000
    if game["cash"] < requirement:
        print(f"Prestij için en az {format_cash(requirement)} nakit gerekli.")
        return
    game["cash"] = 0.0
    game["levels"] = [1, 0, 0, 0, 0]
    game["prestige"] += 1
    print(
        f"Prestij yaptın! Üretimin artık "
        f"{1 + 0.5 * game['prestige']:.1f}x."
    )


def play() -> None:
    game = load_game()
    last_tick = time.time()
    print("Maden İmparatorluğu'na hoş geldin!")
    print("Tek oyunculu idle madencilik oyunu — hile modu başlangıçta açık.")

    while True:
        now = time.time()
        game["cash"] += production_per_second(game) * (now - last_tick)
        last_tick = now
        show_status(game)
        print(
            "1) Maden geliştir  2) Yeni maden aç  3) Hile modunu aç/kapat\n"
            "4) Hile: 100.000 nakit al  5) Prestij yap  6) 60 saniye bekle\n"
            "0) Kaydet ve çık"
        )
        choice = input("> ").strip()

        if choice == "1":
            upgrade_mine(game)
        elif choice == "2":
            unlock_mine(game)
        elif choice == "3":
            game["cheat_mode"] = not game["cheat_mode"]
            state = "açık" if game["cheat_mode"] else "kapalı"
            print(f"Hile modu {state}.")
        elif choice == "4":
            if game["cheat_mode"]:
                game["cash"] += 100_000
                print("Hile kullanıldı: 100.000 nakit eklendi.")
            else:
                print("Önce hile modunu aç.")
        elif choice == "5":
            prestige(game)
        elif choice == "6":
            print("60 saniye ilerliyor...")
            time.sleep(60)
        elif choice == "0":
            save_game(game)
            print("Oyun kaydedildi. Görüşürüz!")
            return
        else:
            print("Menüdeki seçeneklerden birini gir.")


if __name__ == "__main__":
    play()