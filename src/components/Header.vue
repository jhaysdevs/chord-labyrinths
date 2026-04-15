<template>
  <header>
    <p class="eyebrow">Music Theory · Circular Harmony · An Evolving Atlas</p>
    <h1>Harmonic <em>Labyrinths</em></h1>
    <p class="sub">Chord loops you can circle forever — across every style in Western music</p>
    <div class="header-rule"></div>
  </header>
</template>

<style lang="scss" scoped>
header {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 64px 24px 40px;
  border-bottom: 1px solid var(--border);
}

.eyebrow {
  @include label(10px, 0.32em);
  color: var(--text-muted);
  margin-bottom: 16px;
}

h1 {
  @include display-font;
  font-size: clamp(36px, 6vw, 68px);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--text);

  em {
    color: var(--gold);
    font-style: italic;
  }
}

.sub {
  margin-top: 14px;
  @include serif(17px);
  font-style: italic;
  color: var(--text-muted);
}

.header-rule {
  width: 80px;
  height: 1px;
  margin: 24px auto 0;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}
</style>
