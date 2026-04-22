const BUBBLES = [
  { size: 55,  left:  '4%', delay: 0,    dur: 13, drift:  15 },
  { size: 25,  left: '10%', delay: 3.5,  dur:  8, drift: -10 },
  { size: 75,  left: '18%', delay: 1,    dur: 16, drift:  20 },
  { size: 35,  left: '28%', delay: 6,    dur: 10, drift: -15 },
  { size: 48,  left: '36%', delay: 2,    dur: 12, drift:  10 },
  { size: 20,  left: '44%', delay: 8,    dur:  7, drift:  25 },
  { size: 65,  left: '52%', delay: 0.5,  dur: 14, drift: -20 },
  { size: 30,  left: '60%', delay: 4,    dur:  9, drift:  12 },
  { size: 85,  left: '68%', delay: 1.5,  dur: 17, drift: -25 },
  { size: 40,  left: '76%', delay: 7,    dur: 11, drift:  18 },
  { size: 22,  left: '84%', delay: 2.5,  dur:  8, drift:  -8 },
  { size: 60,  left: '90%', delay: 5,    dur: 13, drift:  22 },
  { size: 15,  left: '96%', delay: 9,    dur:  6, drift: -12 },
  { size: 45,  left:  '7%', delay: 11,   dur: 11, drift:  16 },
  { size: 28,  left: '22%', delay: 12.5, dur:  9, drift: -14 },
  { size: 70,  left: '40%', delay: 10,   dur: 15, drift:  28 },
  { size: 18,  left: '55%', delay: 13,   dur:  7, drift:  -9 },
  { size: 50,  left: '72%', delay: 3,    dur: 12, drift:  20 },
  { size: 35,  left: '88%', delay: 14,   dur: 10, drift: -16 },
  { size: 80,  left: '15%', delay: 7.5,  dur: 18, drift:  24 },
  { size: 32,  left:  '2%', delay: 4.5,  dur: 10, drift:  14 },
  { size: 58,  left: '13%', delay: 16,   dur: 14, drift: -18 },
  { size: 16,  left: '25%', delay: 9,    dur:  7, drift:  11 },
  { size: 44,  left: '33%', delay: 15,   dur: 11, drift: -22 },
  { size: 26,  left: '47%', delay: 5.5,  dur:  8, drift:  16 },
  { size: 90,  left: '58%', delay: 17,   dur: 19, drift: -30 },
  { size: 12,  left: '65%', delay: 11.5, dur:  6, drift:  10 },
  { size: 52,  left: '80%', delay: 8.5,  dur: 13, drift: -14 },
  { size: 38,  left: '93%', delay: 2,    dur: 10, drift:  20 },
  { size: 20,  left: '50%', delay: 19,   dur:  8, drift: -12 },
];

const HEADER_BUBBLES = [
  { size: 10, left:  '3%', delay: 0,   dur: 3.5 },
  { size: 14, left:  '8%', delay: 1.2, dur: 4.2 },
  { size:  7, left: '14%', delay: 0.5, dur: 3   },
  { size: 16, left: '20%', delay: 2,   dur: 5   },
  { size:  9, left: '27%', delay: 0.8, dur: 3.5 },
  { size: 12, left: '34%', delay: 1.8, dur: 4   },
  { size:  6, left: '41%', delay: 2.5, dur: 2.8 },
  { size: 18, left: '49%', delay: 0.3, dur: 5.2 },
  { size:  8, left: '57%', delay: 1.5, dur: 3.2 },
  { size: 13, left: '64%', delay: 0.7, dur: 4.2 },
  { size: 11, left: '71%', delay: 2.2, dur: 3.8 },
  { size:  7, left: '79%', delay: 1,   dur: 3   },
  { size: 15, left: '86%', delay: 1.7, dur: 4.5 },
  { size:  9, left: '93%', delay: 0.4, dur: 3.3 },
  { size: 12, left: '97%', delay: 2.8, dur: 4   },
];

export function BubblesBg() {
  return (
    <div className="bubbles-bg" aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <span key={i} className="bubble" style={{
          width: b.size, height: b.size, left: b.left,
          animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`,
          '--drift': `${b.drift}px`,
        }} />
      ))}
    </div>
  );
}

export function HeaderBubbles() {
  return (
    <div className="header-bubbles-layer" aria-hidden="true">
      {HEADER_BUBBLES.map((b, i) => (
        <span key={i} className="header-bubble" style={{
          width: b.size, height: b.size, left: b.left,
          animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`,
        }} />
      ))}
    </div>
  );
}
