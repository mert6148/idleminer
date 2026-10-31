<?php
declare(strict_types=1);

const OFFLINE_LIMIT_SECONDS = 28800;
const MAX_REQUEST_BYTES = 16384;

function respond(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function new_game(): array
{
    return [
        'cash' => 0.0,
        'levels' => [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'cheat_mode' => true,
        'prestige' => 0,
        'last_saved' => microtime(true),
    ];
}

function valid_number(mixed $value): bool
{
    return (is_int($value) || is_float($value)) && is_finite((float) $value);
}

function normalize_game(mixed $input): ?array
{
    if (!is_array($input)
        || !valid_number($input['cash'] ?? null)
        || !is_array($input['levels'] ?? null)
        || !is_bool($input['cheat_mode'] ?? null)
        || !valid_number($input['prestige'] ?? null)) {
        return null;
    }

    $cash = (float) $input['cash'];
    $prestige = (float) $input['prestige'];
    if ($cash < 0 || $cash > 1.0e300
        || $prestige < 0 || $prestige > 1_000_000
        || floor($prestige) !== $prestige) {
        return null;
    }

    $levels = array_slice($input['levels'], 0, 10);
    if (count($levels) !== 10) {
        return null;
    }
    foreach ($levels as $level) {
        if (!is_int($level) || $level < 0 || $level > 1_000_000_000) {
            return null;
        }
    }
    $levels[0] = max(1, $levels[0]);

    return [
        'cash' => $cash,
        'levels' => array_values($levels),
        'cheat_mode' => $input['cheat_mode'],
        'prestige' => (int) $prestige,
        'last_saved' => microtime(true),
    ];
}

function request_game(): array
{
    $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > MAX_REQUEST_BYTES) {
        respond(413, ['error' => 'İstek boyutu izin verilen sınırı aşıyor.']);
    }
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > MAX_REQUEST_BYTES) {
        respond(400, ['error' => 'İstek gövdesi okunamadı.']);
    }
    try {
        $payload = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        respond(400, ['error' => 'Geçerli bir JSON gövdesi gerekli.']);
    }

    $game = normalize_game($payload['game'] ?? null);
    if ($game === null) {
        respond(422, ['error' => 'Oyun kaydı geçersiz.']);
    }
    return $game;
}

function origin_matches_host(): bool
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') {
        return true;
    }
    $originHost = parse_url($origin, PHP_URL_HOST);
    $originPort = parse_url($origin, PHP_URL_PORT);
    $host = $_SERVER['HTTP_HOST'] ?? '';
    if (!is_string($originHost) || $host === '') {
        return false;
    }
    $originAuthority = strtolower($originHost) . ($originPort === null ? '' : ':' . $originPort);
    return hash_equals(strtolower($host), $originAuthority);
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if ($path === '/api/health' || $path === '/api/state') {
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    header('X-Frame-Options: DENY');
    header('Cache-Control: no-store');

    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_set_cookie_params([
        'httponly' => true,
        'secure' => $https,
        'samesite' => 'Strict',
        'path' => '/',
    ]);
    if (!session_start()) {
        respond(500, ['error' => 'Oyun oturumu başlatılamadı.']);
    }

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($path === '/api/health') {
        if ($method !== 'GET') {
            header('Allow: GET');
            respond(405, ['error' => 'Bu uç nokta yalnızca GET kabul eder.']);
        }
        respond(200, ['ok' => true, 'storage' => 'php-session']);
    }

    if ($method === 'GET') {
        $game = $_SESSION['game'] ?? null;
        if (!is_array($game)) {
            respond(200, ['state' => null]);
        }
        $elapsed = min(
            OFFLINE_LIMIT_SECONDS,
            max(0.0, microtime(true) - (float) $game['last_saved'])
        );
        $income = 0.0;
        $incomes = [1, 8, 50, 350, 2500, 18000, 125000, 900000, 6000000, 40000000];
        foreach ($incomes as $index => $rate) {
            $income += $rate * $game['levels'][$index];
        }
        $income *= (1 + 0.5 * $game['prestige']) * ($game['cheat_mode'] ? 10 : 1);
        $game['cash'] += $income * $elapsed;
        $game['last_saved'] = microtime(true);
        $_SESSION['game'] = $game;
        respond(200, ['state' => $game]);
    }

    if ($method === 'POST') {
        if (!origin_matches_host()) {
            respond(403, ['error' => 'İstek kaynağı doğrulanamadı.']);
        }
        $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
        if ($contentType !== 'application/json') {
            respond(415, ['error' => 'Content-Type application/json olmalı.']);
        }
        $game = request_game();
        $_SESSION['game'] = $game;
        respond(200, ['state' => $game]);
    }

    if ($method === 'DELETE') {
        if (!origin_matches_host()) {
            respond(403, ['error' => 'İstek kaynağı doğrulanamadı.']);
        }
        unset($_SESSION['game']);
        respond(200, ['state' => null]);
    }

    header('Allow: GET, POST, DELETE');
    respond(405, ['error' => 'Desteklenmeyen HTTP metodu.']);
}

if (is_string($path) && str_starts_with($path, '/api/')) {
    respond(404, ['error' => 'API uç noktası bulunamadı.']);
}

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('X-Frame-Options: DENY');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
return false;
