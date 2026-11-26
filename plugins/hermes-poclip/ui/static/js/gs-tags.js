/* PA2 3 tầng giám sát — task t_66cb5afb
   Parse và render chip [T1]/[T2]/[T3] từ leading bracket-token cluster
   trong title/raw_message theo board kiem-soat convention. */

const GS_TAGS = {
  T1: { name: 'Hệ thống' },
  T2: { name: 'Vận hành' },
  T3: { name: 'Nghiệp vụ' },
};

function parseGsTag(text) {
  if (!text) return null;
  const s = String(text).replace(/^\s+/, '');
  // Collect only the leading run of bracket tokens (optional whitespace between)
  const clusterMatch = s.match(/^(\[[^\]]*\]\s*)+/);
  if (!clusterMatch) return null;
  const cluster = clusterMatch[0];
  const m = cluster.match(/\[(T[123])\]/);
  if (!m) return null;
  return { tier: m[1] };
}

function renderGsChip(text) {
  const p = parseGsTag(text);
  if (!p) return '';
  const n = p.tier.charAt(1);
  return '<span class="gs-chip gs-chip--t' + n + '">T' + n + ' · ' + GS_TAGS[p.tier].name + '</span>';
}
