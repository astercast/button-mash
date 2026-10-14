/* Wave 6 validation: bracket seeding, byes, advancement, best-of-N.
   Run: node scripts/test_bracket.js
   Exit 0 = all assertions pass. */
'use strict';
const path = require('path');
const Bracket = require(path.join(__dirname, '..', 'assets', 'js', 'bracket.js'));

let failures = 0;
let count = 0;
function check(name, cond, detail) {
  count++;
  if (cond) { console.log('PASS', name, ', ', detail); }
  else { failures++; console.error('FAIL', name, ', ', detail); }
}
function names(n) {
  const out = [];
  for (let i = 1; i <= n; i++) out.push('P' + i);
  return out;
}
function autoPlay(state) {
  // advance side 'a' in every undecided non-bye match, round by round
  for (let r = 0; r < state.totalRounds; r++) {
    Bracket.rounds(state)[r].matches.forEach((mt, m) => {
      if (!mt.decided && mt.a && mt.b) {
        Bracket.recordWin(state, r, m, 'a');
      }
    });
  }
}

// --- seeding math ---
check('seedOrder(2)', JSON.stringify(Bracket.seedOrder(2)) === '[1,2]', Bracket.seedOrder(2).join(','));
check('seedOrder(4)', JSON.stringify(Bracket.seedOrder(4)) === '[1,4,2,3]', Bracket.seedOrder(4).join(','));
check('seedOrder(8)', JSON.stringify(Bracket.seedOrder(8)) === '[1,8,4,5,2,7,3,6]', Bracket.seedOrder(8).join(','));
check('seedOrder(16) length/pairs', Bracket.seedOrder(16).length === 16 &&
  Bracket.seedOrder(16).every((s, i) => i % 2 === 0 ? Bracket.seedOrder(16)[i + 1] === 17 - s : true),
  '8 pairs summing to 17');
check('neededWins', Bracket.neededWins(1) === 1 && Bracket.neededWins(3) === 2 &&
  Bracket.neededWins(5) === 3 && Bracket.neededWins(7) === 4, '1->1, 3->2, 5->3, 7->4');

// --- validation ---
check('rejects 1 player', !!Bracket.createTournament(['Solo']).error, 'error returned');
check('rejects 17 players', !!Bracket.createTournament(names(17)).error, 'error returned');
check('rejects blanks', !!Bracket.createTournament(['', '  ']).error, 'error returned');
check('accepts 2..16', !Bracket.createTournament(names(2)).error && !Bracket.createTournament(names(16)).error, 'ok');
check('dedupes names', (() => {
  const t = Bracket.createTournament(['Ana', 'ana', 'Ben']);
  return !t.error && t.players.join('|') === 'Ana|ana 2|Ben';
})(), 'Ana, ana 2, Ben');

// --- even counts ---
[2, 4, 8, 16].forEach((n) => {
  const t = Bracket.createTournament(names(n));
  const rs = Bracket.rounds(t);
  check(n + ' players: no byes', Bracket.describeByes(t) === null, 'size ' + t.size);
  check(n + ' players: match counts', rs.map((r) => r.matches.length).join(',') ===
    Array.from({ length: t.totalRounds }, (_, i) => n / Math.pow(2, i + 1)).join(','), rs.length + ' rounds');
  autoPlay(t);
  const champ = Bracket.champion(t);
  check(n + ' players: champion P1', !!champ && champ.name === 'P1', champ ? champ.name : 'none');
});

// --- odd counts -> byes handled honestly ---
[[3, 1, ['P1']], [5, 3, ['P1', 'P2', 'P3']], [6, 2, ['P1', 'P2']],
 [7, 1, ['P1']], [9, 7, ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']],
 [11, 5, null], [13, 3, null], [15, 1, ['P1']]].forEach(([n, byeCount, byeNames]) => {
  const t = Bracket.createTournament(names(n));
  const byes = Bracket.describeByes(t);
  check(n + ' players: ' + byeCount + ' byes', byes && byes.length === byeCount,
    'top seeds get byes');
  if (byeNames) {
    check(n + ' players: bye names', JSON.stringify(byes) === JSON.stringify(byeNames), byes.join(','));
  }
  const r0 = Bracket.rounds(t)[0];
  const byeMatches = r0.matches.filter((m) => m.byeAdvance);
  check(n + ' players: bye matches auto-decided', byeMatches.length === byeCount &&
    byeMatches.every((m) => m.winner && !m.winner.bye), byeMatches.length + ' auto-advance');
  const realMatches = r0.matches.filter((m) => !m.byeAdvance);
  check(n + ' players: real matches undecided', realMatches.every((m) => !m.decided), realMatches.length + ' pending');
  const rejected = Bracket.recordWin(t, 0, r0.matches.indexOf(byeMatches[0]), 'a');
  check(n + ' players: bye match rejects manual win', !rejected.ok, rejected.error);
  autoPlay(t);
  const champ = Bracket.champion(t);
  check(n + ' players: champion emerges', !!champ && champ.name === 'P1', champ ? champ.name : 'none');
});

// --- best-of-N ---
{
  const t = Bracket.createTournament(names(4));
  t.bestOf[1] = 3; // semifinal best of 3
  Bracket.recordWin(t, 0, 0, 'a'); // P1 beats P4
  Bracket.recordWin(t, 0, 1, 'b'); // P3 beats P2
  let r = Bracket.recordWin(t, 1, 0, 'a');
  check('bo3: one win does not decide', r.ok && !r.winner, '1-0');
  r = Bracket.recordWin(t, 1, 0, 'b');
  check('bo3: 1-1 still live', r.ok && !r.winner, '1-1');
  r = Bracket.recordWin(t, 1, 0, 'b');
  check('bo3: majority advances', r.ok && r.winner && r.winner.name === 'P3', r.winner.name);
  const after = Bracket.recordWin(t, 1, 0, 'a');
  check('bo3: decided match rejects more wins', !after.ok, after.error);
  const corr = Bracket.removeWin(t, 1, 0, 'a');
  check('removeWin on decided match refused', !corr.ok, corr.error);
}
{
  const t = Bracket.createTournament(names(2));
  Bracket.recordWin(t, 0, 0, 'a');
  check('2-player: immediate champion', Bracket.champion(t).name === 'P1', 'done');
  const c = Bracket.clearMatch(t, 0, 0);
  check('clearMatch unwinds champion', c.ok && Bracket.champion(t) === null, 'no champion');
}
{
  // cascade: clearing a semifinal wipes the final result that depended on it
  const t = Bracket.createTournament(names(4));
  autoPlay(t);
  check('cascade setup: champion P1', Bracket.champion(t).name === 'P1', 'ok');
  Bracket.clearMatch(t, 1, 0);
  check('cascade: final cleared', Bracket.champion(t) === null, 'no champion');
  const rs = Bracket.rounds(t);
  check('cascade: semifinal undecided, first round intact',
    !rs[1].matches[0].decided && rs[0].matches.every((m) => m.decided), 'ok');
}

// --- round names ---
{
  const t8 = Bracket.createTournament(names(8));
  const rn = Bracket.rounds(t8).map((r) => r.name).join('|');
  check('round names (8)', rn === 'Quarterfinal|Semifinal|Final', rn);
  const t4 = Bracket.createTournament(names(4));
  check('round names (4)', Bracket.rounds(t4).map((r) => r.name).join('|') === 'Semifinal|Final', 'ok');
  const t16 = Bracket.createTournament(names(16));
  check('round names (16)', Bracket.rounds(t16).map((r) => r.name).join('|') ===
    'Round 1|Quarterfinal|Semifinal|Final', 'ok');
}

// --- shuffle keeps the same players ---
{
  const t = Bracket.createTournament(names(8));
  Bracket.shufflePlayers(t);
  check('shuffle is a permutation', names(8).every((n) => t.players.includes(n)) &&
    t.players.length === 8, t.players.join(','));
}

console.log('\n' + count + ' assertions, ' + failures + ' failures');
process.exit(failures ? 1 : 0);
