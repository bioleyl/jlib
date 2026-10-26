import { css } from '@jadis/core';
import { Minus, TrendingDown, TrendingUp } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf, oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { areaAttribute, pointsAttribute, sparklinePoints } from '../lib/sparkline';
import { trendOfDelta } from '../lib/trend';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-stat.css?raw';

import type { StatTrend } from '../types/jl-stat.types';
import type { SparkBox } from '../types/sparkline.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ minus: Minus, 'trending-down': TrendingDown, 'trending-up': TrendingUp });

export const STAT_TRENDS: readonly StatTrend[] = ['up', 'down', 'flat'];

type Mood = 'good' | 'bad' | 'neutral';

const SVG_NS = 'http://www.w3.org/2000/svg';
// The sparkline's drawing box; the SVG stretches it to the stat's width.
const SPARK_BOX: SparkBox = { height: 32, inset: 2, width: 100 };
const ICON_SIZE = 16;
const TREND_ICON_SIZE = 14;

const TREND_ICONS: Record<StatTrend, string> = { down: 'trending-down', flat: 'minus', up: 'trending-up' };
const TREND_MOODS: Record<StatTrend, Mood> = { down: 'bad', flat: 'neutral', up: 'good' };
const INVERTED_MOODS: Record<StatTrend, Mood> = { down: 'good', flat: 'neutral', up: 'bad' };

const isNumberList = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'number');

/**
 * A key figure: what it measures, its value, how it moved (`delta`, coloured by its trend) and an optional
 * sparkline of its recent `points`. Put it in a card for a tile; several make a dashboard's row.
 */
export class JlStat extends JlElement {
  static readonly selector = 'jl-stat';

  /** What the figure measures: "Revenue", "Active users". */
  readonly label = this.useChange(
    '',
    (value) => {
      this._refs.label.textContent = value;
    },
    { attribute: 'label' }
  );
  /** The figure, as people read it: "$48,210", "1,204", "98.2%". */
  readonly value = this.useChange(
    '',
    (value) => {
      this._refs.value.textContent = value;
    },
    { attribute: 'value' }
  );
  /** How it changed: "+12.5%", "-3". Its sign gives the trend when `trend` is not set. */
  readonly delta = this.useChange('', () => this.renderDelta(), { attribute: 'delta' });
  /** Which way it went; read from the delta's sign when absent. */
  readonly trend = this.useChange<StatTrend | ''>('', () => this.renderDelta(), {
    attribute: 'trend',
    parse: oneOf<StatTrend | ''>(['', ...STAT_TRENDS], ''),
  });
  /** For figures where down is good (costs, errors, load time): down is green, up is red. */
  readonly invert = this.useChange(false, () => this.renderDelta(), { attribute: 'invert' });
  readonly icon = this.useChange(
    '',
    (value) => {
      this._refs.icon.name.set(value);
      this._refs.icon.hidden = value === '';
    },
    { attribute: 'icon' }
  );
  /** A note under the figure: "vs. last month". */
  readonly caption = this.useChange(
    '',
    (value) => {
      this._refs.caption.textContent = value;
      this._refs.caption.hidden = value === '';
    },
    { attribute: 'caption' }
  );
  /** Recent values, oldest first, drawn as a sparkline: `[4, 6, 5, 9, 12]`. */
  readonly points = this.useChange<number[]>([], () => this.renderSparkline(), {
    attribute: 'points',
    parse: jsonOf<number[]>([]),
  });

  private readonly _refs = this.useRefs((ref) => ({
    caption: ref('.caption'),
    delta: ref('.delta'),
    deltaText: ref('.delta-text'),
    icon: ref<JlIcon>('.icon'),
    label: ref('.label'),
    spark: ref('.spark'),
    trendIcon: ref<JlIcon>('.trend-icon'),
    value: ref('.value'),
  }));

  templateHtml(): Node {
    return (
      <div class="stat" attrs={{ part: 'base' }}>
        <div class="top">
          <span class="label" />
          <JlIcon class="icon" size={ICON_SIZE} hidden />
        </div>
        <div class="figure">
          <span class="value" />
          <span class="delta" hidden>
            <JlIcon class="trend-icon" size={TREND_ICON_SIZE} />
            <span class="delta-text" />
          </span>
        </div>
        <p class="caption" hidden />
        <div class="spark" aria-hidden="true" hidden />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private effectiveTrend(): StatTrend {
    return this.trend.get() || trendOfDelta(this.delta.get());
  }

  private renderDelta(): void {
    const delta = this.delta.get();
    const trend = this.effectiveTrend();
    const moods = this.invert.get() ? INVERTED_MOODS : TREND_MOODS;
    this._refs.deltaText.textContent = delta;
    this._refs.delta.hidden = delta === '';
    this._refs.trendIcon.name.set(TREND_ICONS[trend]);
    this.reflect('direction', trend);
    this.reflect('mood', moods[trend]);
  }

  private renderSparkline(): void {
    const values = this.points.get();
    const points = sparklinePoints(isNumberList(values) ? values : [], SPARK_BOX);
    const spark = this._refs.spark;
    spark.hidden = points.length === 0;
    if (points.length === 0) {
      spark.replaceChildren();
      return;
    }
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${SPARK_BOX.width} ${SPARK_BOX.height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    const area = document.createElementNS(SVG_NS, 'polygon');
    area.setAttribute('class', 'area');
    area.setAttribute('points', areaAttribute(points, SPARK_BOX));
    const line = document.createElementNS(SVG_NS, 'polyline');
    line.setAttribute('class', 'line');
    line.setAttribute('points', pointsAttribute(points));
    svg.append(area, line);
    spark.replaceChildren(svg);
  }
}

JlStat.register();
