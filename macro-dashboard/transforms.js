/** Pure numerical operations. Dates are interpreted in UTC; missing values are not zero. */
const DAY = 86400000;
const VALID_FREQ = new Set(['native', 'D', 'W', 'M', 'Q', 'Y']);
const VALID_AGG = new Set(['mean', 'median', 'min', 'max', 'first', 'last', 'sum']);
const VALID_TRANSFORM = new Set(['raw', 'log', 'base100', 'zscore']);
const iso = d => d.toISOString().slice(0, 10);
const finite = value => typeof value === 'number' && Number.isFinite(value);

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && iso(date) === value ? date : null;
}

function normalized(points, warnings) {
  const byDate = new Map();
  let invalidDates = 0, duplicates = 0, invalidValues = 0;
  for (const point of points || []) {
    if (!Array.isArray(point) || !parseDate(point[0])) { invalidDates++; continue; }
    const value = finite(point[1]) ? point[1] : null;
    if (point[1] !== null && point[1] !== undefined && value === null) invalidValues++;
    if (byDate.has(point[0])) duplicates++;
    byDate.set(point[0], value);
  }
  if (invalidDates) warnings.push(`${invalidDates} 条无效日期已排除。`);
  if (invalidValues) warnings.push(`${invalidValues} 个非数值记录按缺失处理。`);
  if (duplicates) warnings.push(`${duplicates} 条重复日期采用源中最后一条记录。`);
  return [...byDate].sort((a, b) => a[0].localeCompare(b[0]));
}

function periodEnd(dateString, frequency) {
  const date = parseDate(dateString);
  const year = date.getUTCFullYear(), month = date.getUTCMonth();
  switch (frequency) {
    case 'W': date.setUTCDate(date.getUTCDate() + (7 - date.getUTCDay()) % 7); break;
    case 'M': return iso(new Date(Date.UTC(year, month + 1, 0)));
    case 'Q': return iso(new Date(Date.UTC(year, (Math.floor(month / 3) + 1) * 3, 0)));
    case 'Y': return `${year}-12-31`;
  }
  return iso(date);
}

function frequencyRank(points) {
  if (points.length < 3) return 0;
  const deltas = points.slice(1).map((p, i) => (parseDate(p[0]) - parseDate(points[i][0])) / DAY).sort((a, b) => a - b);
  const median = deltas[Math.floor(deltas.length / 2)];
  if (median >= 330) return 4;
  if (median >= 80) return 3;
  if (median >= 27) return 2;
  if (median >= 6) return 1;
  return 0;
}

function aggregate(values, method) {
  const available = values.filter(finite);
  if (!available.length) return null;
  switch (method) {
    case 'first': return available[0];
    case 'last': return available.at(-1);
    case 'min': return Math.min(...available);
    case 'max': return Math.max(...available);
    case 'sum': return available.reduce((sum, value) => sum + value, 0);
    case 'median': {
      const ordered = [...available].sort((a, b) => a - b);
      const mid = Math.floor(ordered.length / 2);
      return ordered.length % 2 ? ordered[mid] : (ordered[mid - 1] + ordered[mid]) / 2;
    }
    default: return available.reduce((sum, value) => sum + value / available.length, 0);
  }
}

export function prepareSeries(points, options = {}) {
  const warnings = [];
  const {start = '', end = '', frequency = 'native', aggregation = 'mean', transform = 'raw'} = options;
  if (!VALID_FREQ.has(frequency)) throw new Error(`未知频率：${frequency}`);
  if (!VALID_AGG.has(aggregation)) throw new Error(`未知聚合方法：${aggregation}`);
  if (!VALID_TRANSFORM.has(transform)) throw new Error(`未知变换：${transform}`);
  if (start && !parseDate(start)) throw new Error('开始日期无效。');
  if (end && !parseDate(end)) throw new Error('结束日期无效。');
  if (start && end && start > end) return {points: [], warnings: ['开始日期晚于结束日期，请调整时间窗口。']};
  const original = normalized(points, warnings);
  let result = original.filter(([date]) => (!start || date >= start) && (!end || date <= end));
  if (!result.length) return {points: [], warnings: [...warnings, '所选时间窗口没有观测值。']};

  if (frequency !== 'native') {
    const targetRank = ['D', 'W', 'M', 'Q', 'Y'].indexOf(frequency);
    if (targetRank < frequencyRank(original)) {
      warnings.push('所选频率高于源数据频率，保留原始观测日期，不插值或补造数据。');
    } else {
      const bins = new Map();
      for (const [date, value] of result) {
        const key = periodEnd(date, frequency);
        if (!bins.has(key)) bins.set(key, []);
        bins.get(key).push(value);
      }
      result = [...bins].map(([date, values]) => [date, aggregate(values, aggregation)]);
      if (frequency !== 'D') warnings.push('按窗口内观测聚合，日期标记为期末；边界期间可能不完整。');
    }
  }

  if (transform === 'log') {
    let excluded = 0;
    result = result.map(([date, value]) => {
      if (value === null) return [date, null];
      if (value <= 0) { excluded++; return [date, null]; }
      return [date, Math.log(value)];
    });
    if (excluded) warnings.push(`自然对数：${excluded} 个非正数按缺失处理。`);
  } else if (transform === 'base100') {
    const base = result.find(([, value]) => finite(value) && value !== 0);
    if (!base) {
      result = result.map(([date]) => [date, null]);
      warnings.push('基期100：窗口内没有有效非零基值，无法计算。');
    } else {
      result = result.map(([date, value]) => [date, value === null ? null : value / base[1] * 100]);
      warnings.push(`基期100：${base[0]} = 100，基值 ${base[1]}。`);
    }
  } else if (transform === 'zscore') {
    const values = result.map(([, value]) => value).filter(finite);
    // Welford's algorithm is stable for large values with small variance.
    let mean = 0, m2 = 0;
    values.forEach((value, index) => {
      const delta = value - mean;
      mean += delta / (index + 1);
      m2 += delta * (value - mean);
    });
    const standardDeviation = Math.sqrt(m2 / values.length);
    if (!Number.isFinite(standardDeviation) || standardDeviation === 0) {
      result = result.map(([date]) => [date, null]);
      warnings.push('Z-score：有效样本不足或数值恒定，标准差为零，无法计算。');
    } else {
      result = result.map(([date, value]) => [date, value === null ? null : (value - mean) / standardDeviation]);
      warnings.push(`Z-score：使用当前窗口内 ${values.length} 个有效值及总体标准差。`);
    }
  }
  let overflow = 0;
  result = result.map(([date, value]) => {
    if (value !== null && !finite(value)) { overflow++; return [date, null]; }
    return [date, value];
  });
  if (overflow) warnings.push(`${overflow} 个计算结果溢出，已标为缺失。`);
  return {points: result, warnings};
}

export function seasonality(points, years = 5) {
  const cleaned = normalized(points, []);
  const availableYears = [...new Set(cleaned.filter(([, value]) => finite(value)).map(([date]) => Number(date.slice(0, 4))))].sort((a, b) => b - a);
  const limit = Math.max(1, Math.min(50, Math.floor(Number(years) || 5)));
  return availableYears.slice(0, limit).map(year => ({
    year,
    points: cleaned.filter(([date]) => Number(date.slice(0, 4)) === year).map(([date, value]) => [`2000${date.slice(4)}`, value]),
  }));
}

export function alignScatter(xPoints, yPoints) {
  const x = new Map(normalized(xPoints, []));
  return normalized(yPoints, []).filter(([date, value]) => finite(x.get(date)) && finite(value)).map(([date, y]) => ({date, x: x.get(date), y}));
}

export function formatNumber(value, percent = false) {
  if (!finite(value)) return '—';
  return new Intl.NumberFormat('zh-CN', percent ? {style: 'percent', maximumFractionDigits: 2} : {maximumFractionDigits: 3}).format(value);
}
