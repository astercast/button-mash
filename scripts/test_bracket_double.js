/* Wave 10 validation: double-elimination bracket logic (assets/js/bracket-double.js).
   Pinned fixtures — fixed player lists and fixed winners, so any logic drift
   fails loudly:
   - 4-player full run through grand final + bracket reset
   - 4-player run where the winners champ takes the final outright (no reset)
   - 8-player losers-bracket merge pairings (survivor[i] vs drop-in[D-1-i])
   - 2-player: zero losers rounds, straight rematch grand final
   - 3-player: first-round byes contribute no losers; lone loser gets a bye
   - cascade: clearing a winners match wipes dependent losers + GF results
   - reseedPlayers wipes results, keeps picks/votes, logs the wipe
   - share encode/decode round-trip + rejection of tampered payloads
   - game voting: majority, tie-break, candidate order
   - guards: bye rejects manual wins, decided rejects more wins,
     grand final rejects before both brackets are done
   Run: node scripts/test_bracket_double.js
   Exit 0 = all assertions pass. */
'use strict';
const path = require('path');
const B = require(path.join(__dirname, '..', 'assets', 'js', 'bracket.js'));
const B2 = require(path.join(__dirname, '..', 'assets', 'js', 'bracket-double.js'));

let failures = 0;
let count = 0;
function check(name, cond, detail) {
  count++;
  if (cond) { console.log('PASS', name, '—', detail); }
  else { failures++; console.error('FAIL', name, '—', detail); }
}
function names(n) {
  const out = [];
  for (let i = 1; i <= n; i++) out.push('P' + i);
  return out;
}
function letters(n) {
  return 'ABCDEFGHIJKLMNOP'.slice(0, n).split('');
}

/* ---------- create ---------- */
{
  const t = B2.createTournamentDouble(letters(4));
  check('double create ok', !t.error && t.version === 2 && t.format === 'double', 'v2/double');
  check('double winners rounds', t.totalWinnersRounds === 2, 'k=2');
  check('double losers round count', B2.losersRoundCount(2) === 2, '2k-2=2');
  check('double losers round count k=1', B2.losersRoundCount(1) === 0, '2 players -> 0');
  check('double losers round count k=4', B2.losersRoundCount(4) === 6, '16 players -> 6');
  check('double rejects 1 player', !!B2.createTournamentDouble(['Solo']).error, 'error');
  check('double rejects 17 players', !!B2.createTournamentDouble(names(17)).error, 'error');
}

/* ---------- 4-player pinned run: reset path ---------- */
function playResetFixture() {
  const t = B2.createTournamentDouble(['A', 'B', 'C', 'D']);
  // W0: order [1,4,2,3] -> M0: A vs D, M1: B vs C
  B2.recordWinnersWin(t, 0, 0, 'a'); // A def D
  B2.recordWinnersWin(t, 0, 1, 'b'); // C def B
  // L0: drop-ins [D, B] -> M0: D vs B
  const l0 = B2.losersRounds(t)[0].matches[0];
  check('4p L0 pairing', l0.a.name === 'D' && l0.b.name === 'B', 'D vs B');
  B2.recordLosersWin(t, 0, 0, 'a'); // D def B
  // W1 final: A vs C
  const w1 = B2.winnersRounds(t)[1].matches[0];
  check('4p W1 pairing', w1.a.name === 'A' && w1.b.name === 'C', 'A vs C');
  B2.recordWinnersWin(t, 1, 0, 'b'); // C def A
  // L1 (Losers Final): survivors [D] + drop-ins [A] -> D vs A
  const l1 = B2.losersRounds(t)[1];
  check('4p last losers round named', l1.name === 'Losers Final', l1.name);
  const l1m = l1.matches[0];
  check('4p L1 pairing', l1m.a.name === 'D' && l1m.b.name === 'A', 'D vs A');
  B2.recordLosersWin(t, 1, 0, 'b'); // A def D
  const slots = B2.grandFinalSlots(t);
  check('4p GF slots', slots.a === 3 && slots.b === 1, 'C(3) vs A(1)');
  const gf = B2.recordGrandWin(t, 0, 'b'); // A (losers champ) def C
  check('4p GF: losers champ wins', gf.ok && gf.winner.name === 'A', 'A wins final');
  check('4p GF: reset required', B2.grandFinalInfo(t).needsReset === true, 'needsReset');
  check('4p GF: no champion yet', B2.champion(t) === null, 'champion TBD');
  const rs = B2.recordGrandWin(t, 1, 'a'); // reset: C def A
  check('4p reset: winners champ wins', rs.ok && rs.winner.name === 'C', 'C wins reset');
  const champ = B2.champion(t);
  check('4p champion', !!champ && champ.name === 'C', champ ? champ.name : 'none');
  const prog = B2.matchProgress(t);
  check('4p progress 7/7', prog.decided === 7 && prog.total === 7,
    prog.decided + '/' + prog.total);
  check('4p history logged', t.history.length >= 7, t.history.length + ' entries');
  return t;
}
playResetFixture();

/* ---------- 4-player: winners champ takes the final outright ---------- */
{
  const t = B2.createTournamentDouble(['A', 'B', 'C', 'D']);
  B2.recordWinnersWin(t, 0, 0, 'a');
  B2.recordWinnersWin(t, 0, 1, 'a'); // B def C
  B2.recordLosersWin(t, 0, 0, 'b'); // C def D (L0: D vs C)
  B2.recordWinnersWin(t, 1, 0, 'a'); // A def B
  B2.recordLosersWin(t, 1, 0, 'a'); // C def B (L1: C vs B)
  const r = B2.recordGrandWin(t, 0, 'a'); // A def C outright
  check('4p outright: winners champ wins', r.ok && r.winner.name === 'A', 'A');
  check('4p outright: no reset needed', B2.grandFinalInfo(t).needsReset === false, 'no reset');
  check('4p outright: champion A', B2.champion(t).name === 'A', 'A');
  const noReset = B2.recordGrandWin(t, 1, 'a');
  check('4p outright: reset rejected', !noReset.ok, noReset.error);
  const prog = B2.matchProgress(t);
  check('4p outright: 6/6 (no reset match)', prog.decided === 6 && prog.total === 6,
    prog.decided + '/' + prog.total);
}

/* ---------- 8-player losers merge pairings ---------- */
{
  const t = B2.createTournamentDouble(names(8));
  // W0 order [1,8,4,5,2,7,3,6]: M0 P1vP8, M1 P4vP5, M2 P2vP7, M3 P3vP6
  for (let m = 0; m < 4; m++) { B2.recordWinnersWin(t, 0, m, 'a'); }
  // L0: [P8,P5] [P7,P6] -> M0: P8vP5, M1: P7vP6
  B2.recordLosersWin(t, 0, 0, 'a'); // P8
  B2.recordLosersWin(t, 0, 1, 'a'); // P7
  // W1: M0 P1vP4 -> P1; M1 P2vP3 -> P2
  B2.recordWinnersWin(t, 1, 0, 'a');
  B2.recordWinnersWin(t, 1, 1, 'a');
  // L1: survivors [P8,P7] + drop-ins [P4,P3] -> M0: P8vP3, M1: P7vP4
  const l1 = B2.losersRounds(t)[1].matches;
  check('8p L1 M0 pairing', l1[0].a.name === 'P8' && l1[0].b.name === 'P3',
    l1[0].a.name + ' vs ' + l1[0].b.name);
  check('8p L1 M1 pairing', l1[1].a.name === 'P7' && l1[1].b.name === 'P4',
    l1[1].a.name + ' vs ' + l1[1].b.name);
  check('8p L1 name', B2.losersRounds(t)[1].name === 'Losers Round 2', 'not the final yet');
  check('8p L3 is Losers Final', B2.losersRounds(t)[3].name === 'Losers Final', 'ok');
}

/* ---------- 2-player: straight rematch ---------- */
{
  const t = B2.createTournamentDouble(['A', 'B']);
  check('2p: no losers rounds', B2.losersRounds(t).length === 0, '0 rounds');
  const early = B2.recordGrandWin(t, 0, 'a');
  check('2p: GF rejected before final', !early.ok, early.error);
  B2.recordWinnersWin(t, 0, 0, 'a'); // A def B
  const slots = B2.grandFinalSlots(t);
  check('2p GF slots', slots.a === 1 && slots.b === 2, 'A vs B rematch');
  B2.recordGrandWin(t, 0, 'b'); // B def A -> reset
  check('2p: reset required', B2.grandFinalInfo(t).needsReset, 'yes');
  check('2p: no champion yet', B2.champion(t) === null, 'TBD');
  B2.recordGrandWin(t, 1, 'a'); // A def B in the reset
  check('2p champion', B2.champion(t).name === 'A', 'A');
}

/* ---------- 3-player: byes contribute no losers ---------- */
{
  const t = B2.createTournamentDouble(['A', 'B', 'C']);
  // W0 order [1,4,2,3]: M0 A vs BYE (auto), M1 B vs C
  const w0 = B2.winnersRounds(t)[0].matches;
  check('3p W0M0 bye', w0[0].byeAdvance && w0[0].winner.name === 'A', 'A auto-advances');
  const byeWin = B2.recordWinnersWin(t, 0, 0, 'a');
  check('3p bye rejects manual win', !byeWin.ok, byeWin.error);
  B2.recordWinnersWin(t, 0, 1, 'a'); // B def C
  // L0: only C drops in -> lone entrant gets a bye
  const l0m = B2.losersRounds(t)[0].matches[0];
  check('3p L0 lone entrant bye', l0m.byeAdvance && l0m.a.name === 'C' && l0m.winner.name === 'C',
    'C advances on a bye');
  const l0win = B2.recordLosersWin(t, 0, 0, 'a');
  check('3p L0 bye rejects manual win', !l0win.ok, l0win.error);
  // L1 (Losers Final): C waits on the W1 loser
  let l1m = B2.losersRounds(t)[1].matches[0];
  check('3p L1 waiting', l1m.a.name === 'C' && l1m.b === null, 'C waits');
  const waitWin = B2.recordLosersWin(t, 1, 0, 'a');
  check('3p L1 rejects win while waiting', !waitWin.ok, waitWin.error);
  B2.recordWinnersWin(t, 1, 0, 'a'); // A def B in the winners final
  l1m = B2.losersRounds(t)[1].matches[0];
  check('3p L1 set', l1m.a.name === 'C' && l1m.b.name === 'B', 'C vs B');
  B2.recordLosersWin(t, 1, 0, 'b'); // B def C
  B2.recordGrandWin(t, 0, 'a'); // A def B outright
  check('3p champion', B2.champion(t).name === 'A', 'A');
}

/* ---------- cascade: clearing a winners match wipes dependents ---------- */
{
  const t = playResetFixture(); // fully played through the reset
  check('cascade setup: champion C', B2.champion(t).name === 'C', 'ok');
  const c = B2.clearWinnersMatch(t, 0, 0); // unpick A def D
  check('cascade: clear ok', c.ok, 'cleared');
  check('cascade: losers results wiped',
    Object.keys(t.results.losers).length === 0, 'losers empty');
  check('cascade: grand final wiped', t.grandFinal === null && t.grandFinalReset === null, 'GF gone');
  check('cascade: no champion', B2.champion(t) === null, 'none');
  const w0 = B2.winnersRounds(t)[0].matches;
  check('cascade: other W0 match intact', w0[1].decided && w0[1].winner.name === 'C', 'C def B stands');
  check('cascade: history notes the wipe',
    t.history.some((e) => /dependent losers results wiped/.test(e.text)), 'logged');
}

/* ---------- cascade 2: clearing a losers match wipes later losers + GF ---------- */
{
  const t = B2.createTournamentDouble(['A', 'B', 'C', 'D']);
  B2.recordWinnersWin(t, 0, 0, 'a');
  B2.recordWinnersWin(t, 0, 1, 'a');
  B2.recordLosersWin(t, 0, 0, 'a'); // D def C
  B2.recordWinnersWin(t, 1, 0, 'a'); // A def B
  B2.recordLosersWin(t, 1, 0, 'a'); // D def B
  B2.recordGrandWin(t, 0, 'a'); // A def D
  const c = B2.clearLosersMatch(t, 0, 0);
  check('cascade2: clear ok', c.ok, 'cleared');
  check('cascade2: later losers wiped', !t.results.losers['r1m0'], 'L1 gone');
  check('cascade2: GF wiped', t.grandFinal === null, 'GF gone');
}

/* ---------- reseed ---------- */
{
  const t = B2.createTournamentDouble(['A', 'B', 'C', 'D']);
  B2.recordWinnersWin(t, 0, 0, 'a');
  t.gamePicks = { A: 'bonk' };
  const r = B2.reseedPlayers(t, ['D', 'C', 'B', 'A']);
  check('reseed ok', r.ok && t.players.join('') === 'DCBA', t.players.join(','));
  check('reseed wipes winners', Object.keys(t.results.winners).length === 0, 'empty');
  check('reseed wipes GF', t.grandFinal === null, 'null');
  check('reseed keeps picks', t.gamePicks.A === 'bonk', 'picks survive');
  check('reseed logs', t.history.some((e) => /Seeds reordered/.test(e.text)), 'logged');
  const bad = B2.reseedPlayers(t, ['A', 'B', 'C']);
  check('reseed rejects different set', !bad.ok, bad.error);
}

/* ---------- share round-trip ---------- */
{
  const t = B2.createTournamentDouble(['A', 'B', 'C', 'D']);
  B2.recordWinnersWin(t, 0, 0, 'a'); // A def D
  B2.recordWinnersWin(t, 0, 1, 'a'); // B def C -> L0M0 is D vs C
  B2.recordLosersWin(t, 0, 0, 'a'); // D def C
  t.gamePicks = { A: 'bonk' };
  const code = B2.encodeShare(t);
  check('share encodes', typeof code === 'string' && code.length > 50 && !/[+/=]/.test(code),
    code.length + ' chars, url-safe');
  const d = B2.decodeShare(code);
  check('share decodes', d.ok, 'ok');
  check('share players', d.ok && d.state.players.join('') === 'ABCD', 'ABCD');
  check('share winners result', d.ok && d.state.results.winners['r0m0'].winner === 1, 'A won');
  check('share losers snapshot', d.ok && d.state.results.losers['r0m0'].aSeed === 4 &&
    d.state.results.losers['r0m0'].bSeed === 3, 'D vs C');
  check('share picks', d.ok && d.state.gamePicks.A === 'bonk', 'picks');
  check('share history', d.ok && d.state.history.length === t.history.length, 'history kept');
  /* single-elim share */
  const s1 = B.createTournament(['A', 'B', 'C', 'D']);
  B.recordWin(s1, 0, 0, 'a');
  const d1 = B2.decodeShare(B2.encodeShare(s1));
  check('share v1 round-trip', d1.ok && d1.state.version === 1 &&
    d1.state.results['r0m0'].winner === 1, 'single elim');
}

/* ---------- share validation rejects tampering ---------- */
function tamper(mutator) {
  const t = B2.createTournamentDouble(['A', 'B', 'C', 'D']);
  const payload = JSON.parse(Buffer.from(
    B2.encodeShare(t).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  mutator(payload);
  let s = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return B2.decodeShare(s);
}
check('share rejects bad chars', !B2.decodeShare('!!!not-valid!!!').ok, 'rejected');
check('share rejects empty', !B2.decodeShare('').ok, 'rejected');
check('share rejects garbage b64', !B2.decodeShare('aGVsbG8').ok, 'rejected'); // "hello", not JSON
check('share rejects unknown version', !tamper((p) => { p.v = 3; }).ok, 'rejected');
check('share rejects format mismatch', !tamper((p) => { p.format = 'single'; }).ok, 'rejected');
check('share rejects 17 players', !tamper((p) => {
  p.players = names(17);
}).ok, 'rejected');
check('share rejects bad result key', !tamper((p) => {
  p.results.winners['x0y0'] = { aWins: 1, bWins: 0, winner: 1 };
}).ok, 'rejected');
check('share rejects bad winner type', !tamper((p) => {
  p.results.winners['r0m0'] = { aWins: 1, bWins: 0, winner: 'A' };
}).ok, 'rejected');
check('share rejects negative score', !tamper((p) => {
  p.results.winners['r0m0'] = { aWins: -1, bWins: 0, winner: null };
}).ok, 'rejected');
check('share rejects bad bestOf', !tamper((p) => { p.bestOf = { 0: 2 }; }).ok, 'rejected');
check('share rejects bad game id', !tamper((p) => { p.games = { 0: 'BONK!!' }; }).ok, 'rejected');
check('share rejects bad GF', !tamper((p) => {
  p.grandFinal = { aSeed: 1, bSeed: 2, aWins: 99, bWins: 0, winner: null };
}).ok, 'rejected');
check('share rejects oversized', !B2.decodeShare('a'.repeat(20001)).ok, 'rejected');

/* ---------- game voting ---------- */
{
  const t = B2.createTournamentDouble(['A', 'B', 'C', 'D']);
  t.gamePicks = { A: 'bonk', B: 'tetrio', C: 'bonk' };
  const cands = B2.voteCandidates(t, 'r0');
  check('vote candidates in seed order', JSON.stringify(cands) === '["bonk","tetrio"]', cands.join(','));
  B2.setGameVote(t, 'r0', 'A', 'bonk');
  B2.setGameVote(t, 'r0', 'B', 'tetrio');
  B2.setGameVote(t, 'r0', 'C', 'bonk');
  const v = B2.computeGameVote(t, 'r0', cands);
  check('vote majority', v.winner === 'bonk' && v.votes === 2 && v.total === 3, 'bonk 2/3');
  const badVoter = B2.setGameVote(t, 'r0', 'Zed', 'bonk');
  check('vote rejects unknown voter', !badVoter.ok, badVoter.error);
  const badGame = B2.setGameVote(t, 'r0', 'A', 'NOT A GAME!!');
  check('vote rejects bad game id', !badGame.ok, badGame.error);
  /* tie -> earliest candidate */
  const t2 = B2.createTournamentDouble(['A', 'B']);
  t2.gamePicks = { A: 'bonk', B: 'tetrio' };
  B2.setGameVote(t2, 'r0', 'A', 'bonk');
  B2.setGameVote(t2, 'r0', 'B', 'tetrio');
  const tie = B2.computeGameVote(t2, 'r0', B2.voteCandidates(t2, 'r0'));
  check('vote tie-break', tie.winner === 'bonk', 'earliest candidate wins ties');
  /* re-vote moves the vote */
  B2.setGameVote(t2, 'r0', 'A', 'tetrio');
  const moved = B2.computeGameVote(t2, 'r0', B2.voteCandidates(t2, 'r0'));
  check('re-vote moves', moved.winner === 'tetrio' && moved.total === 2, 'tetrio 2/2');
}

/* ---------- guards ---------- */
{
  const t = B2.createTournamentDouble(['A', 'B', 'C', 'D']);
  B2.recordWinnersWin(t, 0, 0, 'a');
  B2.recordWinnersWin(t, 0, 1, 'a');
  const dup = B2.recordWinnersWin(t, 0, 0, 'b');
  check('decided winners match rejects', !dup.ok, dup.error);
  const corr = B2.removeWinnersWin(t, 0, 0, 'a');
  check('removeWin on decided refused', !corr.ok, corr.error);
  B2.recordLosersWin(t, 0, 0, 'a');
  const dupL = B2.recordLosersWin(t, 0, 0, 'b');
  check('decided losers match rejects', !dupL.ok, dupL.error);
  const noGF = B2.clearGrandFinal(t, 0);
  check('clear empty GF rejected', !noGF.ok, noGF.error);
  const badSide = B2.recordLosersWin(t, 0, 1, 'c');
  check('bad side rejected', !badSide.ok, badSide.error);
}

/* ---------- mergeEntrants unit ---------- */
{
  const m = B2.mergeEntrants(['s0', 's1'], ['d0', 'd1']);
  check('merge pairing', JSON.stringify(m) === '["s0","d1","s1","d0"]', m.join(','));
  const m2 = B2.mergeEntrants(['s0', 's1', 's2'], ['d0']);
  check('merge leftover survivors', JSON.stringify(m2) === '["s0","d0","s1","s2"]', m2.join(','));
  const m3 = B2.mergeEntrants(['s0'], ['d0', 'd1', 'd2']);
  check('merge leftover drop-ins', JSON.stringify(m3) === '["s0","d2","d0","d1"]', m3.join(','));
}

console.log('\n' + count + ' assertions, ' + failures + ' failures');
process.exit(failures ? 1 : 0);
