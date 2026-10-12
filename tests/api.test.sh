#!/usr/bin/env bash
# tests/api.test.sh — wave A gate for the button-mash Curator (spec §12).
# Runs against the local node harness (tests/run_local.js) which executes the
# real function files, or against a preview URL:
#   ./tests/api.test.sh                      # local (starts harness itself)
#   BASE=https://<preview>.vercel.app ./tests/api.test.sh   # preview
# Exit 0 = all green.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
BASE="${BASE:-}"
HARNESS_PID=""
PORT="${PORT:-3041}"
TEST_SECRET="test-secret-0123456789abcdef"

pass=0; fail=0
chk() { # chk <name> <command...>
  local name="$1"; shift
  if "$@" >/dev/null 2>&1; then pass=$((pass+1)); echo "ok   $name";
  else fail=$((fail+1)); echo "FAIL $name"; fi
}
need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "missing command: $1"; exit 2; }; }
need_cmd curl; need_cmd python3; need_cmd node

if [ -z "$BASE" ]; then
  BASE="http://localhost:$PORT"
  CRON_SECRET="$TEST_SECRET" node "$HERE/run_local.js" "$PORT" >/tmp/mash-harness.log 2>&1 &
  HARNESS_PID=$!
  for i in $(seq 1 30); do
    curl -sf "$BASE/api/health" >/dev/null 2>&1 && break
    sleep 0.2
  done
  curl -sf "$BASE/api/health" >/dev/null || { echo "harness did not start"; cat /tmp/mash-harness.log; exit 2; }
  echo "harness up at $BASE (pid $HARNESS_PID)"
fi

cleanup() { [ -n "$HARNESS_PID" ] && kill "$HARNESS_PID" 2>/dev/null || true; }
trap cleanup EXIT

VALIDATE="python3 $HERE/validate_envelope.py"
PYENV='import json,sys; e=json.load(sys.stdin)'

echo "--- 1. health ---"
chk "health 200" curl -sf "$BASE/api/health"
chk "health envelope valid" bash -c "curl -sf '$BASE/api/health' | $VALIDATE"
chk "health roster matches spec" bash -c "curl -sf '$BASE/api/health' | python3 -c \"
$PYENV; assert e['data']['functions']==['health','games','collections','game-night','cron/curator'], e['data']['functions']\""
chk "health freshness lists 5 files" bash -c "curl -sf '$BASE/api/health' | python3 -c \"
$PYENV; f=e['data']['data_freshness']; assert set(f)=={'games.json','collections.json','emulators.json','homebrew-packs.json','kid-safe.json'}, set(f)\""
chk "health s-maxage=60" bash -c "curl -s -D - -o /dev/null '$BASE/api/health' | grep -qi 's-maxage=60'"

echo "--- 2. games ---"
chk "games 200 + envelope valid" bash -c "curl -sf '$BASE/api/games' | $VALIDATE"
chk "games cache header s-maxage=600" bash -c "curl -s -D - -o /dev/null '$BASE/api/games' | grep -qi 's-maxage=600'"
chk "games default limit<=50" bash -c "curl -sf '$BASE/api/games' | python3 -c \"
$PYENV; assert e['data']['count']<=50 and e['data']['total']==213, (e['data']['count'], e['data']['total'])\""
chk "games multiplayer filter" bash -c "curl -sf '$BASE/api/games?genre=multiplayer&players=4&limit=200' | python3 -c \"
$PYENV; gs=e['data']['games']; assert len(gs)>0 and all(g['multiplayer'] for g in gs), len(gs)\""
chk "games q search" bash -c "curl -sf '$BASE/api/games?q=wordle' | python3 -c \"
$PYENV; assert any(g['id']=='wordle' for g in e['data']['games'])\""
chk "games bad limit 400" bash -c "[ \"\$(curl -s -o /dev/null -w '%{http_code}' '$BASE/api/games?limit=abc')\" = 400 ]"
chk "games bad limit envelope BAD_INPUT" bash -c "curl -s '$BASE/api/games?limit=abc' | python3 -c \"
$PYENV; assert e['ok'] is False and e['error']['code']=='BAD_INPUT'\""
chk "games unknown genre 400" bash -c "curl -s '$BASE/api/games?genre=nope' | python3 -c \"
$PYENV; assert e['ok'] is False and e['error']['code']=='BAD_INPUT'\""
chk "games system=ps1 honest empty" bash -c "curl -sf '$BASE/api/games?system=ps1' | python3 -c \"
$PYENV; assert e['data']['games']==[] and e['data']['note'] is not None\""

echo "--- 3. collections ---"
chk "collections 200 + envelope valid" bash -c "curl -sf '$BASE/api/collections' | $VALIDATE"
chk "collections count 22" bash -c "curl -sf '$BASE/api/collections' | python3 -c \"
$PYENV; assert e['data']['count']==22\""
chk "collections ?id= single" bash -c "curl -sf '$BASE/api/collections?id=rainy-day-cozy' | python3 -c \"
$PYENV; c=e['data']['collections']; assert len(c)==1 and c[0]['id']=='rainy-day-cozy' and c[0]['game_count']>0\""
chk "collections ?id=nope 404" bash -c "curl -s '$BASE/api/collections?id=nope' | python3 -c \"
$PYENV; assert e['ok'] is False and e['error']['code']=='NOT_FOUND'\""

echo "--- 4. game-night ---"
GN_BODY='{"group_size":4,"minutes":90,"vibe":["party"],"kids":false}'
chk "game-night POST 200 + envelope valid" bash -c "curl -sf -X POST -H 'Content-Type: application/json' -d '$GN_BODY' '$BASE/api/game-night' | $VALIDATE"
chk "game-night lineup real" bash -c "curl -sf -X POST -H 'Content-Type: application/json' -d '$GN_BODY' '$BASE/api/game-night' | python3 -c \"
$PYENV; d=e['data']; assert len(d['lineup'])>0 and d['scored_from']==213, d['scored_from']; assert d['scoring_version']=='1.0.0'; assert sum(d['scoring_weights'].values())==100; g=d['lineup'][0]; assert {'game_id','title','url','score','score_breakdown','why','slot_minutes','kid_safe'}<=set(g)\""
chk "game-night deterministic" bash -c "
a=\$(curl -sf -X POST -H 'Content-Type: application/json' -d '$GN_BODY' '$BASE/api/game-night' | python3 -c \"$PYENV; print([g['game_id'] for g in e['data']['lineup']])\")
b=\$(curl -sf -X POST -H 'Content-Type: application/json' -d '$GN_BODY' '$BASE/api/game-night' | python3 -c \"$PYENV; print([g['game_id'] for g in e['data']['lineup']])\")
[ \"\$a\" = \"\$b\" ]"
chk "game-night kids group all kid-safe" bash -c "curl -sf -X POST -H 'Content-Type: application/json' -d '{\"group_size\":3,\"minutes\":60,\"vibe\":[\"cozy\"],\"kids\":true}' '$BASE/api/game-night' | python3 -c \"
$PYENV; gs=e['data']['lineup']; assert len(gs)>0 and all(g['kid_safe'] for g in gs)\""
chk "game-night impossible systems honest no-lineup" bash -c "curl -sf -X POST -H 'Content-Type: application/json' -d '{\"group_size\":4,\"minutes\":60,\"vibe\":[\"party\"],\"systems\":[\"ps1\"]}' '$BASE/api/game-night' | python3 -c \"
$PYENV; d=e['data']; assert d['lineup']==[] and d['no_lineup_reason']=='unsupported-systems' and len(d['plan_notes'])>0\""
chk "game-night missing fields 400" bash -c "curl -s -X POST -H 'Content-Type: application/json' -d '{\"group_size\":4}' '$BASE/api/game-night' | python3 -c \"
$PYENV; assert e['ok'] is False and e['error']['code']=='BAD_INPUT'\""
chk "game-night bad vibe 400" bash -c "curl -s -X POST -H 'Content-Type: application/json' -d '{\"group_size\":2,\"minutes\":30,\"vibe\":[\"spicy\"]}' '$BASE/api/game-night' | python3 -c \"
$PYENV; assert e['ok'] is False and e['error']['code']=='BAD_INPUT'\""
chk "game-night bad json 400" bash -c "curl -s -X POST -H 'Content-Type: application/json' -d 'not json' '$BASE/api/game-night' | python3 -c \"
$PYENV; assert e['ok'] is False and e['error']['code']=='BAD_INPUT'\""
chk "game-night GET 405" bash -c "[ \"\$(curl -s -o /dev/null -w '%{http_code}' '$BASE/api/game-night')\" = 405 ]"

echo "--- 5. cron auth + degrade ---"
chk "cron 401 no secret" bash -c "[ \"\$(curl -s -o /dev/null -w '%{http_code}' '$BASE/api/cron/curator')\" = 401 ]"
chk "cron 401 bad secret" bash -c "[ \"\$(curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer wrong' '$BASE/api/cron/curator')\" = 401 ]"
if [ -n "$HARNESS_PID" ]; then
  # first authorized call runs the real job (read-only: no GITHUB_REPO_TOKEN)
  curl -sf -H "Authorization: Bearer $TEST_SECRET" --max-time 30 "$BASE/api/cron/curator" > /tmp/mash-cron-out.json
  chk "cron 200 with secret, envelope valid" bash -c "cat /tmp/mash-cron-out.json | $VALIDATE"
  chk "cron read_only true, 8 feeds in upstream" bash -c "cat /tmp/mash-cron-out.json | python3 -c \"
$PYENV; d=e['data']; assert d['read_only'] is True and d['committed'] is False, d; assert len(e['meta']['upstream'])==8, len(e['meta']['upstream']); assert e['meta']['degraded'] is True\""
  chk "cron duplicate cooldown" bash -c "curl -sf -H 'Authorization: Bearer $TEST_SECRET' '$BASE/api/cron/curator' | python3 -c \"
$PYENV; assert e['data'].get('duplicate') is True\""
else
  echo "skip live cron run (preview; run manually with secret)"
fi

echo "--- 6. static fallback ---"
chk "static fallback games.json" bash -c "curl -sf '$BASE/api/v1/games.json' | python3 -c \"
import json,sys; d=json.load(sys.stdin); assert len(d['games'])==213\""
chk "static fallback curator-watch.json" bash -c "curl -sf '$BASE/api/v1/curator-watch.json' | python3 -c \"
import json,sys; d=json.load(sys.stdin); assert d['name']=='Button Mash curator watch'\""

echo "--- 7. vercel.json cron-daily lint ---"
chk "cron daily-or-slower" python3 -c "
import json; v=json.load(open('$ROOT/vercel.json'))
crons=v.get('crons',[]); assert len(crons)==1, crons
for c in crons:
    f=c['schedule'].split(); assert len(f)==5, c
    assert f[0]!='*' and '*/' not in f[0] and '*/' not in f[1], c
    print('schedule ok:', c['schedule'], c['path'])"

echo "--- 8. load smoke (50 sequential, no 429, p95<2s warm) ---"
chk "smoke" bash -c "
curl -s -o /dev/null -w '%{http_code}\n' '$BASE/api/health' >/dev/null
for i in \$(seq 1 50); do curl -s -o /dev/null -w '%{http_code} %{time_total}\n' '$BASE/api/health'; done |
python3 -c \"
import sys
codes=[]; ts=[]
for line in sys.stdin:
    c,t=line.split(); codes.append(c); ts.append(float(t))
assert all(c=='200' for c in codes), codes
ts.sort(); p95=ts[int(0.95*len(ts))]
print('non-200:', sum(1 for c in codes if c!='200'), 'p95: %.3fs' % p95)
assert p95 < 2.0, p95\""

echo "=========================="
echo "pass=$pass fail=$fail"
[ "$fail" = 0 ]
