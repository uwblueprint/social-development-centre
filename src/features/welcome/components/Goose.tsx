import { keyframes, styled } from "next-yak";

/*
 * The confirmation screen's doodle: a Canada goose (Waterloo's unofficial mascot) in a party hat,
 * wings up and honking. Drawn in the survey's ink on its paper, coloured only through --survey-* tokens.
 * Once it pops in it keeps hopping and flapping; the global reduced-motion rule stills it.
 */

const pop = keyframes`
  from {
    opacity: 0;
    transform: scale(0.4) translateY(30px);
  }
`;
const hop = keyframes`
  to {
    transform: translateY(-7px);
  }
`;
const flapBack = keyframes`
  from {
    transform: rotate(4deg);
  }
  to {
    transform: rotate(-12deg);
  }
`;
const flapFront = keyframes`
  from {
    transform: rotate(-4deg);
  }
  to {
    transform: rotate(12deg);
  }
`;
const wiggle = keyframes`
  from {
    transform: rotate(-6deg);
  }
  to {
    transform: rotate(6deg);
  }
`;
const fadePulse = keyframes`
  from {
    opacity: 0.3;
  }
`;

/* One beat for the whole bird, so the hop, flaps and hat stay in time. */
const Drawing = styled.svg`
  --beat: calc(var(--duration-slow) * 3);
  --flap: calc(var(--duration-slow) * 1.5);
  display: block;
  width: min(16rem, 64vw);
  height: auto;
  max-height: 34dvh;
  overflow: visible;
  animation: ${pop} var(--duration-enter) var(--ease-spring) both;

  .ink {
    fill: none;
    stroke: var(--survey-ink);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .thin {
    stroke-width: 1.6;
    opacity: 0.55;
  }
  .outlined {
    stroke: var(--survey-ink);
    stroke-width: 2.5;
    stroke-linejoin: round;
  }
  .head {
    fill: var(--survey-goose-head);
  }
  .cheek {
    fill: var(--survey-goose-cheek);
  }
  .body {
    fill: var(--survey-goose-body);
  }
  .breast {
    fill: var(--survey-goose-breast);
  }
  .wing {
    fill: var(--survey-goose-wing);
  }
  .wing-back {
    fill: var(--survey-goose-wing-back);
  }
  .hat {
    fill: var(--survey-doodle-orange);
  }
  .yellow {
    fill: var(--survey-doodle-yellow);
  }
  .orange {
    fill: var(--survey-doodle-orange);
  }
  .blue {
    fill: var(--survey-doodle-blue);
  }
  .red {
    fill: var(--survey-doodle-red);
  }
  .green {
    fill: var(--survey-doodle-green);
  }
  .stripe {
    stroke: var(--survey-goose-cheek);
  }

  .bird {
    animation: ${hop} var(--beat) ease-in-out var(--duration-enter) infinite alternate;
  }
  .flap-back,
  .flap-front,
  .party-hat {
    transform-box: fill-box;
  }
  .flap-back {
    transform-origin: 80% 100%;
    animation: ${flapBack} var(--flap) ease-in-out var(--duration-enter) infinite alternate;
  }
  .flap-front {
    transform-origin: 15% 100%;
    animation: ${flapFront} var(--flap) ease-in-out var(--duration-enter) infinite alternate;
  }
  .party-hat {
    transform-origin: 50% 100%;
    animation: ${wiggle} var(--beat) ease-in-out var(--duration-enter) infinite alternate;
  }
  .honk,
  .sparkles {
    animation: ${fadePulse} var(--beat) ease-in-out var(--duration-enter) infinite alternate;
  }
`;

export function Goose({ label }: { label: string }) {
  return (
    <Drawing viewBox="0 0 240 220" role="img" aria-label={label}>
      <path className="ink" d="M14 200 C40 194 60 204 90 199 C120 194 150 204 180 199 C200 196 214 200 228 198" />
      <path className="ink" d="M30 199 l-3 -9 M35 199 l1 -10 M40 199 l4 -8 M196 199 l-3 -8 M201 199 l1 -10 M206 199 l4 -7 M48 199 v-12 M218 198 v-10" />
      <circle className="yellow outlined" cx="48" cy="184" r="4.5" strokeWidth="2" />
      <circle className="orange outlined" cx="218" cy="185" r="4.5" strokeWidth="2" />

      <g className="bird">
        <g className="flap-back">
          <path
            className="wing-back outlined"
            d="M108 120 C96 104 84 86 80 62 C88 66 92 70 96 74 C94 62 96 52 100 44 C104 56 108 64 112 70 C112 60 116 52 122 46 C124 70 120 96 116 118 Z"
          />
          <path className="ink thin" d="M102 104 L92 80 M110 100 L106 70" />
        </g>
        <g className="flap-front">
          <path
            className="wing outlined"
            d="M124 120 C124 96 132 74 146 56 C148 66 148 72 146 80 C152 72 158 68 166 66 C162 76 156 84 150 90 C156 88 162 88 168 90 C156 104 142 114 130 122 Z"
          />
          <path className="ink thin" d="M134 108 L146 80 M140 112 L158 92" />
        </g>
        <path className="ink" strokeWidth="3" d="M108 170 L104 196 M128 170 L132 196" />
        <path className="head outlined" strokeWidth="2" d="M93 199 L104 193 L115 199 Z M121 199 L132 193 L143 199 Z" />
        <path className="head outlined" strokeWidth="2" d="M76 134 L56 126 L60 140 L54 150 L78 148 Z" />
        <path className="body outlined" d="M72 138 C70 112 102 104 128 108 C156 112 172 126 168 146 C164 166 136 174 112 172 C88 170 74 160 72 138 Z" />
        <path className="breast" d="M142 114 C158 118 168 130 166 148 C158 140 150 132 140 128 Z" />
        <path className="cheek outlined" strokeWidth="1.6" d="M80 152 C86 160 96 164 106 165 C94 167 84 163 80 152 Z" />
        <path className="ink thin" d="M96 140 q10 6 22 4 M100 153 q12 6 26 2 M118 128 q10 4 20 2" />
        <path className="head" d="M146 120 C148 102 150 86 154 70 L170 68 C168 86 166 104 166 122 Z" />
        <path className="head" d="M150 64 C148 50 162 42 175 46 C186 50 188 62 180 68 C172 74 154 74 150 64 Z" />
        <path className="cheek" d="M155 62 C158 54 168 52 174 58 C171 66 160 69 155 62 Z" />
        <circle className="cheek" cx="178" cy="53" r="2" />
        <path className="head outlined" strokeWidth="1.6" d="M184 53 L204 47 L186 59 Z M185 62 L201 64 L184 66 Z" />
        <g className="party-hat">
          <path className="hat outlined" d="M157 47 L177 44 L170 13 Z" />
          <path className="ink stripe" d="M161 37 L174 35 M165 26 L172 25" />
          <circle className="yellow outlined" cx="170" cy="12" r="5.5" strokeWidth="2" />
        </g>
      </g>

      <path className="ink honk" d="M210 40 l10 -7 M213 53 l13 0 M210 66 l10 6" />
      <g className="sparkles">
        <path className="yellow outlined" strokeWidth="2" d="M52 52 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z" />
        <path className="blue outlined" strokeWidth="2" d="M206 104 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" />
        <circle className="red outlined" cx="36" cy="110" r="4" strokeWidth="2" />
        <circle className="green outlined" cx="226" cy="150" r="3.5" strokeWidth="2" />
      </g>
    </Drawing>
  );
}
