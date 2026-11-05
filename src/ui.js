import { CONFIG } from './config.js';
import { POWERS } from './powers.js';
import { powerIcon, LOCK_ICON } from './icons.js';
import { formatMoney } from './utils.js';
import { SFX } from './audio.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor() {
    this.menu = $('menu');
    this.hud = $('hud');
    this.results = $('results');
    this.switchOverlay = $('switch-overlay');

    this.onPlay = null;
    this.onSwitchPick = null;
    this.onResultsDone = null;

    this.powerIndex = 0;
    this.bet = CONFIG.BETS[1];
    this.rareUnlocked = new Set();
    this.announceTimer = null;

    this.buildMenu();
    this.buildSwitchOverlay();

    $('results-btn').addEventListener('click', () => { SFX.click(); this.onResultsDone?.(); });
    $('sound-btn').addEventListener('click', () => {
      SFX.setEnabled(!SFX.enabled);
      $('sound-btn').classList.toggle('off', !SFX.enabled);
      SFX.click();
    });
    $('sound-btn').classList.toggle('off', !SFX.enabled);
  }

  // ---------- MENU ----------
  buildMenu() {
    const betWrap = $('bet-options');
    betWrap.innerHTML = '';
    for (const b of CONFIG.BETS) {
      const chip = document.createElement('button');
      chip.className = 'bet-chip' + (b === this.bet ? ' on' : '');
      chip.textContent = '$' + b;
      chip.addEventListener('click', () => {
        SFX.click();
        this.bet = b;
        betWrap.querySelectorAll('.bet-chip').forEach((c) => c.classList.toggle('on', c === chip));
      });
      betWrap.appendChild(chip);
    }

    $('play-btn').addEventListener('click', () => {
      SFX.unlock();
      const power = POWERS[this.powerIndex];
      if (power.rare && !this.rareUnlocked.has(power.id)) return;
      SFX.click();
      this.onPlay?.(power, this.bet);
    });

    this.renderPowerGrid();
  }

  rollRarePowers() {
    // Rare powers are only sometimes on the menu — re-rolled every lobby visit.
    this.rareUnlocked.clear();
    for (const p of POWERS) {
      if (p.rare && Math.random() < 0.5) this.rareUnlocked.add(p.id);
    }
  }

  renderPowerGrid() {
    // if the current pick got locked by the rotation, hop to the first open power
    let p = POWERS[this.powerIndex];
    if (p.rare && !this.rareUnlocked.has(p.id)) {
      this.powerIndex = POWERS.findIndex((pw) => !pw.rare || this.rareUnlocked.has(pw.id));
      p = POWERS[this.powerIndex];
    }
    const grid = $('power-grid');
    grid.innerHTML = '';
    POWERS.forEach((pw, i) => {
      const locked = pw.rare && !this.rareUnlocked.has(pw.id);
      const cell = document.createElement('div');
      cell.className = 'pg-cell'
        + (i === this.powerIndex ? ' on' : '')
        + (pw.rare ? ' rare' : '')
        + (locked ? ' locked' : '');
      cell.style.setProperty('--pcolor', '#' + pw.color.toString(16).padStart(6, '0'));
      cell.innerHTML = `<div class="em">${powerIcon(pw.id)}${locked ? LOCK_ICON : ''}</div><div class="nm">${pw.name}</div>`;
      cell.addEventListener('click', () => {
        SFX.click();
        if (locked) {
          $('power-desc').innerHTML = `<b>${pw.name}</b> — RARE power, not in this lobby rotation. Check back after your next round.`;
          return;
        }
        this.powerIndex = i;
        this.renderPowerGrid();
      });
      grid.appendChild(cell);
    });
    $('power-desc').innerHTML = `<b>${p.name}</b> — ${p.desc}`;
    $('play-btn').disabled = false;
  }

  showMenu(wallet) {
    this.rollRarePowers();
    this.renderPowerGrid();
    $('wallet-value').textContent = formatMoney(wallet);
    // grey out bets the wallet can't cover
    const chips = $('bet-options').children;
    for (let i = 0; i < chips.length; i++) {
      const affordable = CONFIG.BETS[i] <= wallet;
      chips[i].style.opacity = affordable ? 1 : 0.3;
      chips[i].style.pointerEvents = affordable ? 'auto' : 'none';
      if (!affordable && CONFIG.BETS[i] === this.bet) {
        this.bet = CONFIG.BETS[0];
        chips[0]?.classList.add('on');
        chips[i].classList.remove('on');
      }
    }
    this.menu.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.results.classList.add('hidden');
  }

  showHUD(isTouch) {
    this.menu.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.results.classList.add('hidden');
    $('keys-hint').style.display = isTouch ? 'none' : '';
    $('attack-btn').style.display = isTouch ? '' : 'none';
    $('killfeed').innerHTML = '';
  }

  // ---------- HUD ----------
  setTotal(total, mult, bump = false) {
    const el = $('total-value');
    el.textContent = formatMoney(total);
    $('total-mult').textContent = mult.toFixed(2) + '×';
    if (bump) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  }

  setHP(frac) {
    const f = $('hp-fill');
    f.style.width = Math.max(0, frac * 100) + '%';
    f.classList.toggle('low', frac < 0.35);
  }

  setPowerButton(power, cooldownFrac) {
    $('poweruse-icon').innerHTML = power ? powerIcon(power.id, '100%') : powerIcon('speed', '100%');
    const circ = $('cd-circle');
    circ.style.stroke = power ? '#' + power.color.toString(16).padStart(6, '0') : '#6ea8ff';
    circ.style.strokeDashoffset = String(289 * cooldownFrac);
    $('poweruse-btn').classList.toggle('oncd', cooldownFrac > 0.02);
  }

  setSwitches(n) { $('switch-count').textContent = n; }

  setBuffs(buffs) {
    $('buff-row').innerHTML = buffs
      .map((b) => `<span class="buff-chip">${b.icon ? powerIcon(b.icon) : b.emblem} ${b.label}</span>`)
      .join('');
  }

  leaderboard(rows) {
    $('leaderboard').innerHTML = rows
      .map((r) => `<div class="lb-row${r.me ? ' me' : ''}"><span class="lb-name">${r.rank}. ${r.name}</span><span>${formatMoney(r.score)}</span></div>`)
      .join('');
  }

  killfeed(text, mine = false) {
    const feed = $('killfeed');
    const row = document.createElement('div');
    row.className = 'kf-row' + (mine ? ' me' : '');
    row.innerHTML = text;
    feed.prepend(row);
    while (feed.children.length > 5) feed.lastChild.remove();
    setTimeout(() => row.remove(), 6000);
  }

  popup(x, y, text, big = false) {
    const el = document.createElement('div');
    el.className = 'pop' + (big ? ' big' : '');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    this.hud.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  announce(text, { danger = false, dur = 2200, icon = null } = {}) {
    const el = $('announce');
    el.textContent = text;
    if (icon) el.innerHTML = powerIcon(icon) + '<span>' + el.innerHTML + '</span>';
    el.classList.remove('hidden');
    el.classList.toggle('danger', danger);
    clearTimeout(this.announceTimer);
    this.announceTimer = setTimeout(() => el.classList.add('hidden'), dur);
  }


  flash() {
    const el = $('flash');
    el.classList.remove('go');
    void el.offsetWidth;
    el.classList.add('go');
  }

  // ---------- SWITCH ----------
  buildSwitchOverlay() {
    $('switch-btn').addEventListener('click', () => this.onSwitchOpen?.());
    $('switch-cancel').addEventListener('click', () => { SFX.click(); this.closeSwitch(); });
  }

  openSwitch(currentId, switchesLeft, free = false) {
    SFX.click();
    $('switch-left-label').innerHTML = free ? '<span>FREE</span>' : `<span>${switchesLeft} LEFT</span>`;
    const grid = $('switch-grid');
    grid.innerHTML = '';
    for (const p of POWERS) {
      const cell = document.createElement('div');
      const disabled = p.id === currentId || (!free && switchesLeft <= 0);
      cell.className = 'switch-cell' + (p.id === currentId ? ' current' : '') + (disabled ? ' disabled' : '');
      cell.innerHTML = `<div class="em">${powerIcon(p.id)}</div><div class="nm">${p.name}</div>`;
      cell.addEventListener('click', () => {
        if (disabled) return;
        SFX.click();
        this.closeSwitch();
        this.onSwitchPick?.(p);
      });
      grid.appendChild(cell);
    }
    this.switchOverlay.classList.remove('hidden');
  }

  closeSwitch() { this.switchOverlay.classList.add('hidden'); }
  get switchOpen() { return !this.switchOverlay.classList.contains('hidden'); }

  // ---------- RESULTS ----------
  showResults({ payout, mult, kills, tokens, place, killerName, killerPower, win }) {
    $('results-title').textContent = win ? 'CASHED OUT' : 'ELIMINATED';
    $('results-title').classList.toggle('win', win);
    $('results-killer').textContent = killerName
      ? `taken down by ${killerName} (${killerPower})`
      : '';
    $('results-payout').textContent = formatMoney(payout);
    $('results-mult').textContent = mult.toFixed(2) + '× your bet';
    $('results-stats').innerHTML =
      `<div><b>${kills}</b>KILLS</div><div><b>${tokens}</b>TOKENS</div><div><b>#${place}</b>PLACE</div>`;
    this.results.classList.remove('hidden');
  }
}
